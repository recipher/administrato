import type * as s from 'zapatos/schema';
import * as db from 'zapatos/db';
import pool from '../db.server';

export { default as create } from '../id.server';

import SecurityGroupService, { type SecurityGroup } from './security-groups.server';

import type { SecurityKey, SearchOptions as BaseSearchOptions, Count, TxOrPool,
  QueryOptions, IdProp, NameProp, KeyQueryOptions as BaseKeyQueryOptions, BypassKeyCheck } from '../types';
import { ASC, DESC } from '../types';
  
import { type User } from '../access/users.server';

import { whereKeys, whereExactKeys, extractKeys, pickKeys, generateIdentifier } from './shared.server';

export type Client = s.clients.Selectable & { groupCount?: number, securityGroup?: string };

type KeyQueryOptions = {
  parentId?: string | undefined;
} & BaseKeyQueryOptions;

type SearchOptions = {
  securityGroup?: SecurityGroup | undefined;
  parentId?: string | null | undefined;
  securityGroupId?: string | null | undefined;
} & BaseSearchOptions;

const Service = (u: User) => {
  const getLatest = async (client: s.clients.Insertable, txOrPool: TxOrPool = pool) => {
    const query = client.parentId 
      ? db.sql<db.SQL>`${'parentId'} = ${db.param(client.parentId)}`
      : db.sql<db.SQL>`${'securityGroupId'} = ${db.param(client.securityGroupId)}`;

    const [ latest ] = await db.sql<s.clients.SQL, s.clients.Selectable[]>`
      SELECT * FROM ${'clients'}
      WHERE ${'keyEnd'} IS NOT NULL AND ${query}
      ORDER BY ${'keyEnd'} DESC
      LIMIT 1
      `.run(txOrPool);
    return latest;
  };

  const generateKey = async (client: s.clients.Insertable, txOrPool: TxOrPool = pool): Promise<SecurityKey> => {
    const service = SecurityGroupService(u);

    const parent = client.parentId
      ? await getClient({ id: client.parentId as string }, { bypassKeyCheck: true }, txOrPool)
      : await service.getSecurityGroup({ id: client.securityGroupId as string }, { bypassKeyCheck: true }, txOrPool)
 
    const maxEntities = client.parentId ? 100 : 1000000; // Move to constants

    const latest = await getLatest(client, txOrPool);

    if (parent === undefined) throw new Error('Error generating security key');

    const keyStart = Number(latest?.keyEnd ? Number(latest.keyEnd) + 1 : parent.keyStart);
    const keyEnd = keyStart + Number(Math.round(parent.keyEnd as unknown as number / maxEntities));

    return { keyStart, keyEnd };
  };

  const addClient = async (client: s.clients.Insertable, txOrPool: TxOrPool = pool) => {
    const key = await generateKey(client, txOrPool);
    const withKey = { ...client, ...key, identifier: generateIdentifier(client) };

    const [inserted] = await db.sql<s.clients.SQL, s.clients.Selectable[]>`
      INSERT INTO ${'clients'} (${db.cols(withKey)})
      VALUES (${db.vals(withKey)}) RETURNING *`.run(txOrPool);

    return inserted;
  };

  const updateClient = async ({ id, ...client }: s.clients.Updatable, txOrPool: TxOrPool = pool) => {
    const [ update ] = 
      await db.update('clients', client, { id: id as string }).run(txOrPool);
    return update;
  };

  const listClients = async (query: KeyQueryOptions = { isArchived: false }, txOrPool: TxOrPool = pool) => {
    const keys = query.keys || extractKeys(u, "securityGroup", "client"); 
    const whereParent = query.parentId 
      ? db.sql`main.${'parentId'} = ${db.param(query.parentId)}`
      : db.sql`main.${'parentId'} IS NULL`;
    return await db.sql<s.clients.SQL, s.clients.Selectable[]>`
      SELECT main.* FROM ${'clients'} AS main
      WHERE ${whereParent} AND ${whereKeys({ keys, ...query })}
      `.run(txOrPool);
  };

  const searchQuery = ({ search, securityGroupId, parentId, isArchived }: SearchOptions) => {
    const parent = parentId 
      ? db.sql`main.${'parentId'} = ${db.param(parentId)}`
      : db.sql`main.${'parentId'} IS NULL`;

    const name = search == null ? db.sql<db.SQL>`` : db.sql<db.SQL>`
      AND LOWER(main.${'name'}) LIKE LOWER(${db.param(`${search}%`)})`;

    const archived = db.sql` AND main.${'isArchived'} = ${db.raw(isArchived ? 'TRUE' : 'FALSE')}`;

    const base = db.sql`${parent} ${name} ${archived}`;
    return !securityGroupId ? base
      : db.sql<db.SQL>`${base} AND main.${'securityGroupId'} = ${db.param(securityGroupId)}`; 
  };

  const countClients = async (search: SearchOptions, txOrPool: TxOrPool = pool) => {
    const keys = pickKeys(search.securityGroup) || extractKeys(u, "securityGroup", "client");

    const [ item ] = await db.sql<s.clients.SQL, s.clients.Selectable[]>`
      SELECT COUNT(main.${'id'}) AS count FROM ${'clients'} AS main
      WHERE ${searchQuery(search)} AND ${whereKeys({ keys })}
    `.run(txOrPool);

    const { count } = item as unknown as Count;
    return count;
  };

  const searchClients = async (search: SearchOptions, { offset = 0, limit = 8, sortDirection = ASC }: QueryOptions, txOrPool: TxOrPool = pool) => {  
    const keys = pickKeys(search.securityGroup) || extractKeys(u, "securityGroup", "client");

    if (sortDirection == null || (sortDirection !== ASC && sortDirection !== DESC)) sortDirection = ASC;

    const clients = await db.sql<s.clients.SQL | s.securityGroups.SQL, s.clients.Selectable[]>`
      SELECT main.*, s.${'name'} AS "securityGroup", COUNT(g.${'id'}) AS "groupCount" 
      FROM ${'clients'} AS main
      LEFT JOIN ${'clients'} AS g ON main.${'id'} = g.${'parentId'}
      LEFT JOIN ${'securityGroups'} AS s ON main.${'securityGroupId'} = s.${'id'}
      WHERE ${searchQuery(search)} AND ${whereKeys({ keys })}
      GROUP BY main.${'id'}, s.${'name'}
      ORDER BY main.${'name'} ${db.raw(sortDirection)}
      OFFSET ${db.param(offset)}
      LIMIT ${db.param(limit)}
    `.run(txOrPool);

    const count = await countClients(search, txOrPool);

    return { clients, metadata: { count }};
  };

  const getClient = async ({ id }: IdProp, { bypassKeyCheck = false }: BypassKeyCheck = {}, txOrPool: TxOrPool = pool) => {
    const keys = extractKeys(u, "securityGroup", "client");

    const [ client ] = await db.sql<s.clients.SQL | s.securityGroups.SQL, s.clients.Selectable[]>`
      SELECT main.*, s.${'name'} AS "securityGroup", g.${'name'} AS parent
      FROM ${'clients'} AS main
      LEFT JOIN ${'clients'} AS g ON main.${'parentId'} = g.${'id'}
      LEFT JOIN ${'securityGroups'} AS s ON main.${'securityGroupId'} = s.${'id'}
      WHERE ${whereKeys({ keys, bypassKeyCheck })} AND 
        (main.${'id'} = ${db.param(id)} OR LOWER(main.${'identifier'}) = ${db.param(id.toLowerCase())})
    `.run(txOrPool);

    return client;
  };

  const getClientByName = async ({ name }: NameProp, { bypassKeyCheck = false }: BypassKeyCheck = {}, txOrPool: TxOrPool = pool) => {
    const keys = u.keys.client;

    const [ client ] = await db.sql<s.clients.SQL, s.clients.Selectable[]>`
      SELECT main.* FROM ${'clients'} AS main
      WHERE ${whereKeys({ keys, bypassKeyCheck })} AND LOWER(main.${'name'}) = ${db.param(name.toLowerCase())}
    `.run(txOrPool);

    return client;
  };

  // Required to determine exactly which entities a user has authorization for
  const listClientsForKeys = async ({ keys }: KeyQueryOptions, txOrPool: TxOrPool = pool) => {
    if (keys === undefined) return [];
    return await db.sql<s.clients.SQL, s.clients.Selectable[]>`
      SELECT main.* FROM ${'clients'} AS main
      WHERE ${whereExactKeys({ keys })}
    `.run(txOrPool);
  };

  return {
    addClient,
    updateClient,
    getClient,
    getClientByName,
    searchClients,
    countClients,
    listClients,
    listClientsForKeys
  };
};

export default Service;