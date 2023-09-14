import type * as s from 'zapatos/schema';
import * as db from 'zapatos/db';
import pool from '../db.server';

import ServiceCentreService from './service-centres.server';

import type { SecurityKey, SearchOptions as BaseSearchOptions, Count,
  QueryOptions, IdProp, KeyQueryOptions } from '../types';
import { ASC, DESC } from '../types';
  
import { type User } from '../access/users.server';

import { whereKeys, whereExactKeys } from './shared.server';

export type Client = s.clients.Selectable;

type SearchOptions = {
  serviceCentreId?: number;
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
      ? await getClient({ id: client.parentId as number })
      : await service.getServiceCentre({ id: client.serviceCentreId as number })
 
    const maxEntities = client.parentId ? 100 : 100000;

    const latest = await getLatest(client);

    if (parent === undefined) throw new Error('Error generating security key');

    const keyStart = Number(latest?.keyEnd ? Number(latest.keyEnd) + 1 : parent.keyStart);
    const keyEnd = keyStart + Number(Math.round(parent.keyEnd as unknown as number / maxEntities));

    return { keyStart, keyEnd };
  };

  const addClient = async (client: s.clients.Insertable) => {
    const key = await generateKey(client);
    const withKey = { ...client, ...key };

    const [inserted] = await db.sql<s.clients.SQL, s.clients.Selectable[]>`
      INSERT INTO ${'clients'} (${db.cols(withKey)})
      VALUES (${db.vals(withKey)}) RETURNING *`.run(pool);

    return inserted;
  };

  const listClients = async (query: KeyQueryOptions = { isArchived: false }) => {
    const keys = query.keys || [ ...u.keys.serviceCentre, ...u.keys.client ];
    return await db.sql<s.clients.SQL, s.clients.Selectable[]>`
      SELECT * FROM ${'clients'}
      WHERE ${whereKeys({ keys, ...query })}
      `.run(pool);
  };

  const searchQuery = ({ search }: SearchOptions) =>
    search == null ? db.sql<db.SQL>`` : db.sql<db.SQL>`
      AND
        LOWER(${'clients'}.${'name'}) LIKE LOWER('${db.raw(search)}%')
    `;

  const countClients = async ({ search }: SearchOptions) => {
    const keys = [ ...u.keys.serviceCentre, ...u.keys.client ];
    const [ item ] = await db.sql<s.clients.SQL, s.clients.Selectable[]>`
      SELECT COUNT(${'id'}) AS count FROM ${'clients'}
      WHERE ${'parentId'} IS NULL ${searchQuery({ search })} AND ${whereKeys({ keys })}
    `.run(pool);

    const { count } = item as unknown as Count;
    return count;
  };

  const searchClients = async ({ search }: SearchOptions, { offset = 0, limit = 8, sortDirection = ASC }: QueryOptions) => {  
    const keys = [ ...u.keys.serviceCentre, ...u.keys.client ];

    if (sortDirection == null || (sortDirection !== ASC && sortDirection !== DESC)) sortDirection = ASC;

    const clients = await db.sql<s.clients.SQL, s.clients.Selectable[]>`
      SELECT * FROM ${'clients'}
      WHERE ${'parentId'} IS NULL ${searchQuery({ search })} AND ${whereKeys({ keys })}
      ORDER BY ${'clients'}.${'name'} ${db.raw(sortDirection)}
      OFFSET ${db.param(offset)}
      LIMIT ${db.param(limit)}
      `.run(pool);
    const count = await countClients({ search });

    return { clients, metadata: { count }};
  };

  const getClient = async ({ id }: IdProp) => {
    const keys = [ ...u.keys.serviceCentre, ...u.keys.client ];
    const [ client ] = await db.sql<s.clients.SQL, s.clients.Selectable[]>`
      SELECT * FROM ${'clients'}
      WHERE ${whereKeys({ keys })} AND ${'id'} = ${db.param(id)}
      `.run(pool);

    return client;
  };

  // Required to determine exactly which entities a user has authorization for
  const listClientsForKeys = async ({ keys }: KeyQueryOptions) => {
    if (keys === undefined) return [];
    return await db.sql<s.clients.SQL, s.clients.Selectable[]>`
      SELECT * FROM ${'clients'}
      WHERE ${whereExactKeys({ keys })}
      `.run(pool);
  };

  return {
    addClient,
    getClient,
    searchClients,
    countClients,
    listClients,
    listClientsForKeys
  };
};

export default service;