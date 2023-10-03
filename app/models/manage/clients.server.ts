import type * as s from 'zapatos/schema';
import * as db from 'zapatos/db';
import pool from '../db.server';

export { default as create } from '../id.server';

import ServiceCentreService, { type ServiceCentre } from './service-centres.server';

import type { SecurityKey, SearchOptions as BaseSearchOptions, Count,
  QueryOptions, IdProp, NameProp, KeyQueryOptions as BaseKeyQueryOptions, BypassKeyCheck } from '../types';
import { ASC, DESC } from '../types';
  
import { type User } from '../access/users.server';

import { whereKeys, whereExactKeys, extractKeys, pickKeys, generateIdentifier } from './shared.server';

export type Client = s.clients.Selectable & { groupCount?: number, serviceCentre?: string };

type KeyQueryOptions = {
  parentId?: string | undefined;
} & BaseKeyQueryOptions;

type SearchOptions = {
  serviceCentre?: ServiceCentre | undefined;
  parentId?: string | null | undefined;
  serviceCentreId?: string | null | undefined;
} & BaseSearchOptions;

const service = (u: User) => {
  const getLatest = async (client: s.clients.Insertable) => {
    const query = client.parentId 
      ? db.sql<db.SQL>`${'parentId'} = ${db.param(client.parentId)}`
      : db.sql<db.SQL>`${'serviceCentreId'} = ${db.param(client.serviceCentreId)}`;

    const [ latest ] = await db.sql<s.clients.SQL, s.clients.Selectable[]>`
      SELECT * FROM ${'clients'}
      WHERE ${'keyEnd'} IS NOT NULL AND ${query}
      ORDER BY ${'keyEnd'} DESC
      LIMIT 1
      `.run(pool);
    return latest;
  };

  const generateKey = async (client: s.clients.Insertable): Promise<SecurityKey> => {
    const service = ServiceCentreService(u);

    const parent = client.parentId
      ? await getClient({ id: client.parentId as string })
      : await service.getServiceCentre({ id: client.serviceCentreId as string })
 
    const maxEntities = client.parentId ? 100 : 1000000; // Move to constants

    const latest = await getLatest(client);

    if (parent === undefined) throw new Error('Error generating security key');

    const keyStart = Number(latest?.keyEnd ? Number(latest.keyEnd) + 1 : parent.keyStart);
    const keyEnd = keyStart + Number(Math.round(parent.keyEnd as unknown as number / maxEntities));

    return { keyStart, keyEnd };
  };

  const addClient = async (client: s.clients.Insertable) => {
    const key = await generateKey(client);
    const withKey = { ...client, ...key, identifier: generateIdentifier(client) };

    const [inserted] = await db.sql<s.clients.SQL, s.clients.Selectable[]>`
      INSERT INTO ${'clients'} (${db.cols(withKey)})
      VALUES (${db.vals(withKey)}) RETURNING *`.run(pool);

    return inserted;
  };

  const listClients = async (query: KeyQueryOptions = { isArchived: false }) => {
    const keys = query.keys || extractKeys(u, "serviceCentre", "client"); 
    const whereParent = query.parentId 
      ? db.sql`main.${'parentId'} = ${db.param(query.parentId)}`
      : db.sql`main.${'parentId'} IS NULL`;
    return await db.sql<s.clients.SQL, s.clients.Selectable[]>`
      SELECT main.* FROM ${'clients'} AS main
      WHERE ${whereParent} AND ${whereKeys({ keys, ...query })}
      `.run(pool);
  };

  const searchQuery = ({ search, serviceCentreId, parentId }: SearchOptions) => {
    const parent = parentId 
      ? db.sql`main.${'parentId'} = ${db.param(parentId)}`
      : db.sql`main.${'parentId'} IS NULL`;

      const name = search == null ? db.sql<db.SQL>`` : db.sql<db.SQL>`
        AND LOWER(main.${'name'}) LIKE LOWER(${db.param(`${search}%`)})`;

    return !serviceCentreId ? db.sql`${parent} ${name}`
      : db.sql<db.SQL>`${parent} ${name} AND main.${'serviceCentreId'} = ${db.param(serviceCentreId)}`; 
  };

  const countClients = async (search: SearchOptions) => {
    const keys = pickKeys(search.serviceCentre) || extractKeys(u, "serviceCentre", "client");

    const [ item ] = await db.sql<s.clients.SQL, s.clients.Selectable[]>`
      SELECT COUNT(main.${'id'}) AS count FROM ${'clients'} AS main
      WHERE ${searchQuery(search)} AND ${whereKeys({ keys })}
    `.run(pool);

    const { count } = item as unknown as Count;
    return count;
  };

  const searchClients = async (search: SearchOptions, { offset = 0, limit = 8, sortDirection = ASC }: QueryOptions) => {  
    const keys = pickKeys(search.serviceCentre) || extractKeys(u, "serviceCentre", "client");

    if (sortDirection == null || (sortDirection !== ASC && sortDirection !== DESC)) sortDirection = ASC;

    const clients = await db.sql<s.clients.SQL | s.serviceCentres.SQL, s.clients.Selectable[]>`
      SELECT main.*, s.${'name'} AS "serviceCentre", COUNT(g.${'id'}) AS "groupCount" 
      FROM ${'clients'} AS main
      LEFT JOIN ${'clients'} AS g ON main.${'id'} = g.${'parentId'}
      LEFT JOIN ${'serviceCentres'} AS s ON main.${'serviceCentreId'} = s.${'id'}
      WHERE ${searchQuery(search)} AND ${whereKeys({ keys })}
      GROUP BY main.${'id'}, s.${'name'}
      ORDER BY main.${'name'} ${db.raw(sortDirection)}
      OFFSET ${db.param(offset)}
      LIMIT ${db.param(limit)}
      `.run(pool);

    const count = await countClients(search);

    return { clients, metadata: { count }};
  };

  const getClient = async ({ id }: IdProp, { bypassKeyCheck = false }: BypassKeyCheck = {}) => {
    const keys = extractKeys(u, "serviceCentre", "client");

    const [ client ] = await db.sql<s.clients.SQL | s.serviceCentres.SQL, s.clients.Selectable[]>`
      SELECT main.*, s.${'name'} AS "serviceCentre" FROM ${'clients'} AS main
      LEFT JOIN ${'serviceCentres'} AS s ON main.${'serviceCentreId'} = s.${'id'}
      WHERE ${whereKeys({ keys, bypassKeyCheck })} AND 
        (main.${'id'} = ${db.param(id)} OR LOWER(main.${'identifier'}) = ${db.param(id.toLowerCase())})
      `.run(pool);

    return client;
  };

  const getClientByName = async ({ name }: NameProp, { bypassKeyCheck = false }: BypassKeyCheck = {}) => {
    const keys = u.keys.client;

    const [ client ] = await db.sql<s.clients.SQL, s.clients.Selectable[]>`
      SELECT main.* FROM ${'clients'} AS main
      WHERE ${whereKeys({ keys, bypassKeyCheck })} AND LOWER(main.${'name'}) = ${db.param(name.toLowerCase())}
      `.run(pool);

    return client;
  };

  // Required to determine exactly which entities a user has authorization for
  const listClientsForKeys = async ({ keys }: KeyQueryOptions) => {
    if (keys === undefined) return [];
    return await db.sql<s.clients.SQL, s.clients.Selectable[]>`
      SELECT main.* FROM ${'clients'} AS main
      WHERE ${whereExactKeys({ keys })}
      `.run(pool);
  };

  return {
    addClient,
    getClient,
    getClientByName,
    searchClients,
    countClients,
    listClients,
    listClientsForKeys
  };
};

export default service;