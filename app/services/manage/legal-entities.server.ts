import type * as s from 'zapatos/schema';
import * as db from 'zapatos/db';
import pool from '../db.server';

export { default as create } from '../id.server';

import SecurityGroupService, { type SecurityGroup } from './security-groups.server';
import ProviderService, { type Provider } from './providers.server';
import ClientService, { type Client } from './clients.server';

import type { SecurityKey, SearchOptions as BaseSearchOptions, Count, TxOrPool,
  QueryOptions, IdProp, NameProp, KeyQueryOptions, BypassKeyCheck } from '../types';
import { ASC, DESC } from '../types';
  
import { type User } from '../access/users.server';

import { whereKeys, whereExactKeys, extractKeys, pickKeys, generateIdentifier } from './shared.server';

export type LegalEntity = s.legalEntities.Selectable & { provider?: string, securityGroup?: string };

type SearchOptions = {
  securityGroup?: SecurityGroup | undefined;
  provider?: Provider | undefined;
  client?: Client | undefined;
  securityGroupId?: string | null | undefined;
  clientId?: string | null | undefined;
  providerId?: string | null | undefined;
} & BaseSearchOptions;

const Service = (u: User) => {
  const getLatest = async (legalEntity: s.legalEntities.Insertable, txOrPool: TxOrPool = pool) => {
    const query = legalEntity.securityGroupId
      ? db.sql<db.SQL>`${'securityGroupId'} = ${db.param(legalEntity.securityGroupId)}`
      : db.sql<db.SQL>`${'clientId'} = ${db.param(legalEntity.clientId)}`;

    const [ latest ] = await db.sql<s.legalEntities.SQL, s.legalEntities.Selectable[]>`
      SELECT * FROM ${'legalEntities'}
      WHERE ${'keyEnd'} IS NOT NULL AND ${query}
      ORDER BY ${'keyEnd'} DESC
      LIMIT 1
    `.run(txOrPool);
    return latest;
  };

  const generateKey = async (legalEntity: s.legalEntities.Insertable, txOrPool: TxOrPool = pool): Promise<SecurityKey> => {
    const parent = legalEntity.securityGroupId
      ? await SecurityGroupService(u).getSecurityGroup({ id: legalEntity.securityGroupId as string }, { bypassKeyCheck: true }, txOrPool)
      : await ClientService(u).getClient({ id: legalEntity.clientId as string }, { bypassKeyCheck: true }, txOrPool)
      
    const maxEntities = 10000; // Move to constants
    const latest = await getLatest(legalEntity, txOrPool);

    if (parent === undefined) throw new Error('Error generating security key');

    const keyStart = Number(latest?.keyEnd ? Number(latest.keyEnd) + 1 : parent.keyStart);
    const keyEnd = keyStart + Number(Math.round(parent.keyEnd as unknown as number / maxEntities));

    return { keyStart, keyEnd };
  };

  const addLegalEntity = async (legalEntity: s.legalEntities.Insertable, txOrPool: TxOrPool = pool) => {
    const key = await generateKey(legalEntity);
    const withKey = { ...legalEntity, ...key, identifier: generateIdentifier(legalEntity) };

    const [inserted] = await db.sql<s.legalEntities.SQL, s.legalEntities.Selectable[]>`
      INSERT INTO ${'legalEntities'} (${db.cols(withKey)})
      VALUES (${db.vals(withKey)}) RETURNING *`
    .run(txOrPool);

    return inserted;
  };

  const updateLegalEntity = async ({ id, ...legalEntity }: s.legalEntities.Updatable, txOrPool: TxOrPool = pool) => {
    const [ update ] = 
      await db.update('legalEntities', legalEntity, { id: id as string }).run(txOrPool);
    return update;
  };

  const listLegalEntities = async (query: KeyQueryOptions = { isArchived: false }, txOrPool: TxOrPool = pool) => {
    const keys = query.keys || extractKeys(u, "securityGroup", "legalEntity"); 
    
    return await db.sql<s.legalEntities.SQL | s.securityGroups.SQL | s.clients.SQL | s.providers.SQL, s.legalEntities.Selectable[]>`
      SELECT main.*, p.${'name'} AS provider, s.${'name'} AS "securityGroup", c.${'name'} AS "client" 
      LEFT JOIN ${'providers'} AS p ON main.${'providerId'} = p.${'id'}
      LEFT JOIN ${'securityGroups'} AS s ON main.${'securityGroupId'} = s.${'id'}
      LEFT JOIN ${'clients'} AS c ON main.${'clientId'} = c.${'id'}
      WHERE ${whereKeys({ keys, ...query })}
    `.run(txOrPool);
  };

  const searchQuery = ({ search, securityGroupId, providerId, clientId, isArchived }: SearchOptions) => {
    const name = search == null ? db.sql<db.SQL>`main.${'name'} IS NOT NULL` : db.sql<db.SQL>`
      LOWER(main.${'name'}) LIKE LOWER(${db.param(`${search}%`)})`;

    const whereSecurityGroup = securityGroupId == null ? db.sql<db.SQL>``
      : db.sql<db.SQL>`AND main.${'securityGroupId'} = ${db.param(securityGroupId)}`;
    const whereProvider = providerId == null ? db.sql<db.SQL>``
      : db.sql<db.SQL>`AND main.${'providerId'} = ${db.param(providerId)}`;
    const whereClient = clientId == null ? db.sql<db.SQL>``
      : db.sql<db.SQL>`AND main.${'clientId'} = ${db.param(clientId)}`;

    const archived = db.sql` AND main.${'isArchived'} = ${db.raw(isArchived ? 'TRUE' : 'FALSE')}`;

    return db.sql<db.SQL>`${name} ${archived} ${whereClient} ${whereSecurityGroup} ${whereProvider}`;    
  };

  const countLegalEntities = async (search: SearchOptions, txOrPool: TxOrPool = pool) => {
    const keys = pickKeys(search.securityGroup) || pickKeys(search.provider) || 
      extractKeys(u, "securityGroup", "legalEntity", "client");
    
    const [ item ] = await db.sql<s.legalEntities.SQL, s.legalEntities.Selectable[]>`
      SELECT COUNT(main.${'id'}) AS count FROM ${'legalEntities'} AS main
      WHERE ${searchQuery(search)} AND ${whereKeys({ keys })}  
    `.run(txOrPool);

    const { count } = item as unknown as Count;
    return count;
  };

  const searchLegalEntities = async (search: SearchOptions, { offset = 0, limit = 8, sortDirection = ASC }: QueryOptions, txOrPool: TxOrPool = pool) => {  
    const keys = pickKeys(search.securityGroup) || pickKeys(search.provider) || 
       extractKeys(u, "securityGroup", "legalEntity", "client");
    if (sortDirection == null || (sortDirection !== ASC && sortDirection !== DESC)) sortDirection = ASC;

    const legalEntities = await db.sql<s.legalEntities.SQL | s.providers.SQL | s.clients.SQL | s.securityGroups.SQL, s.legalEntities.Selectable[]>`
      SELECT main.*, p.${'name'} AS provider, s.${'name'} AS "securityGroup", c.${'name'} AS "client" 
      FROM ${'legalEntities'} AS main
      LEFT JOIN ${'providers'} AS p ON main.${'providerId'} = p.${'id'}
      LEFT JOIN ${'securityGroups'} AS s ON main.${'securityGroupId'} = s.${'id'}
      LEFT JOIN ${'clients'} AS c ON main.${'clientId'} = c.${'id'}
      WHERE ${searchQuery(search)} AND ${whereKeys({ keys })}
      ORDER BY main.${'name'} ${db.raw(sortDirection)}
      OFFSET ${db.param(offset)}
      LIMIT ${db.param(limit)}
    `.run(txOrPool);
    const count = await countLegalEntities(search, txOrPool);

    return { legalEntities, metadata: { count }};
  };

  const getLegalEntity = async ({ id }: IdProp, { bypassKeyCheck = false }: BypassKeyCheck = {}, txOrPool: TxOrPool = pool) => {
    const keys = extractKeys(u, "securityGroup", "legalEntity", "client");

    const [ client ] = await db.sql<s.legalEntities.SQL | s.clients.SQL | s.providers.SQL | s.securityGroups.SQL, s.legalEntities.Selectable[]>`
      SELECT main.*, p.${'name'} AS provider, s.${'name'} AS "securityGroup", c.${'name'} AS "client" 
      FROM ${'legalEntities'} AS main
      LEFT JOIN ${'providers'} AS p ON main.${'providerId'} = p.${'id'}
      LEFT JOIN ${'securityGroups'} AS s ON main.${'securityGroupId'} = s.${'id'}
      LEFT JOIN ${'clients'} AS c ON main.${'clientId'} = c.${'id'}
      WHERE ${whereKeys({ keys, bypassKeyCheck })} AND  
      (main.${'id'} = ${db.param(id)} OR LOWER(main.${'identifier'}) = ${db.param(id.toLowerCase())})
    `.run(txOrPool);

    return client;
  };

  const getLegalEntityByName = async ({ name }: NameProp, { bypassKeyCheck = false }: BypassKeyCheck = {}, txOrPool: TxOrPool = pool) => {
    const keys = u.keys.legalEntity;

    const [ legalEntity ] = await db.sql<s.legalEntities.SQL, s.legalEntities.Selectable[]>`
      SELECT main.* FROM ${'legalEntities'} AS main
      WHERE ${whereKeys({ keys, bypassKeyCheck })} AND LOWER(main.${'name'}) = ${db.param(name.toLowerCase())}
    `.run(txOrPool);

    return legalEntity;
  };

  const getRelatedEntities = async ({ id }: IdProp, txOrPool: TxOrPool = pool) => {
    return db.serializable(txOrPool, async tx => {
      const bypass = { bypassKeyCheck: true };
      const legalEntity = await getLegalEntity({ id }, bypass, tx);
      const securityGroup = await SecurityGroupService(u).getSecurityGroup({ id: legalEntity.securityGroupId }, bypass, tx);
      const provider = legalEntity.providerId ? await ProviderService(u).getProvider({ id: legalEntity.providerId }, bypass, tx) : undefined;
      const client = legalEntity.clientId ? await ClientService(u).getClient({ id: legalEntity.clientId }, bypass, tx) : undefined;
      return { legalEntity, securityGroup, provider, client };
    });
  };

  // Required to determine exactly which entities a user has authorization for
  const listLegalEntitiesForKeys = async ({ keys }: KeyQueryOptions, txOrPool: TxOrPool = pool) => {
    if (keys === undefined) return [];
    return await db.sql<s.legalEntities.SQL, s.legalEntities.Selectable[]>`
      SELECT main.* FROM ${'legalEntities'} AS main
      WHERE ${whereExactKeys({ keys })}
    `.run(txOrPool);
  };

  return {
    addLegalEntity,
    updateLegalEntity,
    getLegalEntity,
    getLegalEntityByName,
    getRelatedEntities,
    searchLegalEntities,
    countLegalEntities,
    listLegalEntities,
    listLegalEntitiesForKeys
  };
};

export default Service;