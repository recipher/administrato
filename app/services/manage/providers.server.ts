import type * as s from 'zapatos/schema';
import * as db from 'zapatos/db';
import pool from '../db.server';

export { default as create } from '../id.server';

import SecurityGroupService, { type SecurityGroup } from './security-groups.server';

import type { SecurityKey, SearchOptions as BaseSearchOptions, Count, TxOrPool,
  QueryOptions, IdProp, NameProp, KeyQueryOptions, BypassKeyCheck } from '../types';
import { ASC, DESC } from '../types';
  
import { type User } from '../access/users.server';

import { whereKeys, whereExactKeys, extractKeys, pickKeys, generateIdentifier } from './shared.server';

export type Provider = s.providers.Selectable & { securityGroup?: string };

type SearchOptions = {
  securityGroup?: SecurityGroup | undefined;
  securityGroupId?: string | undefined;
} & BaseSearchOptions;

const Service = (u: User) => {
  const getLatest = async (provider: s.providers.Insertable, txOrPool: TxOrPool = pool) => {
    const query = db.sql<db.SQL>`${'securityGroupId'} = ${db.param(provider.securityGroupId)}`;

    const [ latest ] = await db.sql<s.providers.SQL, s.providers.Selectable[]>`
      SELECT * FROM ${'providers'}
      WHERE ${'keyEnd'} IS NOT NULL AND ${query}
      ORDER BY ${'keyEnd'} DESC
      LIMIT 1
    `.run(txOrPool);
    return latest;
  };

  const generateKey = async (provider: s.providers.Insertable, txOrPool: TxOrPool = pool): Promise<SecurityKey> => {
    const service = SecurityGroupService(u);

    const parent = await service.getSecurityGroup({ id: provider.securityGroupId as string }, { bypassKeyCheck: true }, txOrPool)
    const maxEntities = 10000; // Move to constants
    const latest = await getLatest(provider);

    if (parent === undefined) throw new Error('Error generating security key');

    const keyStart = Number(latest?.keyEnd ? Number(latest.keyEnd) + 1 : parent.keyStart);
    const keyEnd = keyStart + Number(Math.round(parent.keyEnd as unknown as number / maxEntities));

    return { keyStart, keyEnd };
  };

  const addProvider = async (provider: s.providers.Insertable, txOrPool: TxOrPool = pool) => {
    const key = await generateKey(provider);
    const withKey = { ...provider, createdBy: u, ...key, identifier: generateIdentifier(provider) };

    const [inserted] = await db.sql<s.providers.SQL, s.providers.Selectable[]>`
      INSERT INTO ${'providers'} (${db.cols(withKey)})
      VALUES (${db.vals(withKey)}) RETURNING *`
    .run(txOrPool);

    return inserted;
  };

  const updateProvider = async ({ id, ...provider }: s.providers.Updatable, txOrPool: TxOrPool = pool) => {
    const [ update ] = 
      await db.update('providers', { ...provider, updatedBy: u }, { id: id as string })
      .run(txOrPool);
    return update;
  };

  const listProviders = async (query: KeyQueryOptions = { isArchived: false }, txOrPool: TxOrPool = pool) => {
    const keys = query.keys || extractKeys(u, "securityGroup", "provider"); 
    return await db.sql<s.providers.SQL, s.providers.Selectable[]>`
      SELECT main.* FROM ${'providers'} AS main
      WHERE ${whereKeys({ keys, ...query })}
    `.run(txOrPool);
  };

  const searchQuery = ({ search, securityGroupId, isArchived }: SearchOptions) => {
    const name = search == null ? db.sql<db.SQL>`main.${'name'} IS NOT NULL` : db.sql<db.SQL>`
      LOWER(main.${'name'}) LIKE LOWER(${db.param(`${search}%`)})`;

    const archived = db.sql` AND main.${'isArchived'} = ${db.raw(isArchived ? 'TRUE' : 'FALSE')}`;

    const base = db.sql`${name} ${archived}`;
    return securityGroupId == null ? base
      : db.sql<db.SQL>`${base} AND main.${'securityGroupId'} = ${db.param(securityGroupId)}`; 
  };

  const countProviders = async (search: SearchOptions, txOrPool: TxOrPool = pool) => {
    const keys = pickKeys(search.securityGroup) || extractKeys(u, "securityGroup", "provider");
    const [ item ] = await db.sql<s.providers.SQL, s.providers.Selectable[]>`
      SELECT COUNT(main.${'id'}) AS count FROM ${'providers'} AS main
      WHERE ${searchQuery(search)} AND ${whereKeys({ keys })}  
    `.run(txOrPool);

    const { count } = item as unknown as Count;
    return count;
  };

  const searchProviders = async (search: SearchOptions, { offset = 0, limit = 8, sortDirection = ASC }: QueryOptions, txOrPool: TxOrPool = pool) => {  
    const keys = pickKeys(search.securityGroup) || extractKeys(u, "securityGroup", "provider");
    if (sortDirection == null || (sortDirection !== ASC && sortDirection !== DESC)) sortDirection = ASC;

    const providers = await db.sql<s.providers.SQL | s.securityGroups.SQL, s.providers.Selectable[]>`
      SELECT main.*, s.${'name'} AS "securityGroup" FROM ${'providers'} AS main
      LEFT JOIN ${'securityGroups'} AS s ON main.${'securityGroupId'} = s.${'id'}
      WHERE ${searchQuery(search)} AND ${whereKeys({ keys })}  
      ORDER BY main.${'name'} ${db.raw(sortDirection)}
      OFFSET ${db.param(offset)}
      LIMIT ${db.param(limit)}
    `.run(txOrPool);
    const count = await countProviders(search, txOrPool);

    return { providers, metadata: { count }};
  };

  const getProvider = async ({ id }: IdProp, { bypassKeyCheck = false }: BypassKeyCheck = {}, txOrPool: TxOrPool = pool) => {
    const keys = extractKeys(u, "securityGroup", "provider");

    const [ provider ] = await db.sql<s.providers.SQL | s.securityGroups.SQL, s.providers.Selectable[]>`
      SELECT main.*, s.${'name'} AS "securityGroup" FROM ${'providers'} AS main
      LEFT JOIN ${'securityGroups'} AS s ON main.${'securityGroupId'} = s.${'id'}
      WHERE ${whereKeys({ keys, bypassKeyCheck })} AND  
        (main.${'id'} = ${db.param(id)} OR LOWER(main.${'identifier'}) = ${db.param(id.toLowerCase())})
    `.run(txOrPool);

    return provider;
  };

  const getProviderByName = async ({ name }: NameProp, { bypassKeyCheck = false }: BypassKeyCheck = {}, txOrPool: TxOrPool = pool) => {
    const keys = u.keys.provider;

    const [ provider ] = await db.sql<s.providers.SQL, s.providers.Selectable[]>`
      SELECT main.* FROM ${'providers'} AS main
      WHERE ${whereKeys({ keys, bypassKeyCheck })} AND LOWER(main.${'name'}) = ${db.param(name.toLowerCase())}
    `.run(txOrPool);

    return provider;
  };

  // Required to determine exactly which entities a user has authorization for
  const listProvidersForKeys = async ({ keys }: KeyQueryOptions, txOrPool: TxOrPool = pool) => {
    if (keys === undefined) return [];
    return await db.sql<s.providers.SQL, s.providers.Selectable[]>`
      SELECT main.* FROM ${'providers'} AS main
      WHERE ${whereExactKeys({ keys })}
    `.run(txOrPool);
  };

  return {
    addProvider,
    updateProvider,
    getProvider,
    getProviderByName,
    searchProviders,
    countProviders,
    listProviders,
    listProvidersForKeys
  };
};

export default Service;