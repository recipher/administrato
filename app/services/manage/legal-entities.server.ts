import type * as s from 'zapatos/schema';
import * as db from 'zapatos/db';
import pool from '../db.server';

export { default as create } from '../id.server';

import ServiceCentreService, { type ServiceCentre } from './service-centres.server';
import { type Provider } from './providers.server';

import type { SecurityKey, SearchOptions as BaseSearchOptions, Count, TxOrPool,
  QueryOptions, IdProp, NameProp, KeyQueryOptions, BypassKeyCheck } from '../types';
import { ASC, DESC } from '../types';
  
import { type User } from '../access/users.server';

import { whereKeys, whereExactKeys, extractKeys, pickKeys, generateIdentifier } from './shared.server';

export type LegalEntity = s.legalEntities.Selectable & { provider?: string, serviceCentre?: string };

type SearchOptions = {
  serviceCentre?: ServiceCentre | undefined;
  provider?: Provider | undefined;
  serviceCentreId?: string | null | undefined;
  providerId?: string | null | undefined;
} & BaseSearchOptions;

const Service = (u: User) => {
  const getLatest = async (legalEntity: s.legalEntities.Insertable, txOrPool: TxOrPool = pool) => {
    const query = db.sql<db.SQL>`${'serviceCentreId'} = ${db.param(legalEntity.serviceCentreId)}`;

    const [ latest ] = await db.sql<s.legalEntities.SQL, s.legalEntities.Selectable[]>`
      SELECT * FROM ${'legalEntities'}
      WHERE ${'keyEnd'} IS NOT NULL AND ${query}
      ORDER BY ${'keyEnd'} DESC
      LIMIT 1
    `.run(txOrPool);
    return latest;
  };

  const generateKey = async (legalEntity: s.legalEntities.Insertable, txOrPool: TxOrPool = pool): Promise<SecurityKey> => {
    const service = ServiceCentreService(u);

    const parent = await service.getServiceCentre({ id: legalEntity.serviceCentreId as string }, { bypassKeyCheck: true }, txOrPool)
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

  const listLegalEntities = async (query: KeyQueryOptions = { isArchived: false }, txOrPool: TxOrPool = pool) => {
    const keys = query.keys || extractKeys(u, "serviceCentre", "legalEntity"); 
    
    return await db.sql<s.legalEntities.SQL | s.providers.SQL, s.legalEntities.Selectable[]>`
      SELECT main.*, p.${'name'} AS provider FROM ${'legalEntities'} AS main
      LEFT JOIN ${'providers'} AS p ON main.${'providerId'} = p.${'id'}
      WHERE ${whereKeys({ keys, ...query })}
    `.run(txOrPool);
  };

  const searchQuery = ({ search, serviceCentreId, providerId, isArchived }: SearchOptions) => {
    const name = search == null ? db.sql<db.SQL>`main.${'name'} IS NOT NULL` : db.sql<db.SQL>`
      LOWER(main.${'name'}) LIKE LOWER(${db.param(`${search}%`)})`;

    const whereServiceCentre = serviceCentreId == null ? db.sql<db.SQL>`main.${'serviceCentreId'} IS NOT NULL`
      : db.sql<db.SQL>`main.${'serviceCentreId'} = ${db.param(serviceCentreId)}`;
    const whereProvider = providerId == null ? db.sql<db.SQL>`main.${'providerId'} IS NOT NULL`
      : db.sql<db.SQL>`main.${'providerId'} = ${db.param(providerId)}`;

    const archived = db.sql` AND main.${'isArchived'} = ${db.raw(isArchived ? 'TRUE' : 'FALSE')}`;

    return db.sql<db.SQL>`${name} ${archived} AND ${whereServiceCentre} AND ${whereProvider}`;    
  };

  const countLegalEntities = async (search: SearchOptions, txOrPool: TxOrPool = pool) => {
    const keys = pickKeys(search.serviceCentre) || pickKeys(search.provider) || 
      extractKeys(u, "serviceCentre", "legalEntity");
    
    const [ item ] = await db.sql<s.legalEntities.SQL, s.legalEntities.Selectable[]>`
      SELECT COUNT(main.${'id'}) AS count FROM ${'legalEntities'} AS main
      WHERE ${searchQuery(search)} AND ${whereKeys({ keys })}  
    `.run(txOrPool);

    const { count } = item as unknown as Count;
    return count;
  };

  const searchLegalEntities = async (search: SearchOptions, { offset = 0, limit = 8, sortDirection = ASC }: QueryOptions, txOrPool: TxOrPool = pool) => {  
    const keys = pickKeys(search.serviceCentre) || pickKeys(search.provider) || 
       extractKeys(u, "serviceCentre", "legalEntity");
    if (sortDirection == null || (sortDirection !== ASC && sortDirection !== DESC)) sortDirection = ASC;

    const legalEntities = await db.sql<s.legalEntities.SQL | s.providers.SQL | s.serviceCentres.SQL, s.legalEntities.Selectable[]>`
      SELECT main.*, p.${'name'} AS provider, s.${'name'} AS "serviceCentre" 
      FROM ${'legalEntities'} AS main
      LEFT JOIN ${'providers'} AS p ON main.${'providerId'} = p.${'id'}
      LEFT JOIN ${'serviceCentres'} AS s ON main.${'serviceCentreId'} = s.${'id'}
      WHERE ${searchQuery(search)} AND ${whereKeys({ keys })}
      ORDER BY main.${'name'} ${db.raw(sortDirection)}
      OFFSET ${db.param(offset)}
      LIMIT ${db.param(limit)}
    `.run(txOrPool);
    const count = await countLegalEntities(search, txOrPool);

    return { legalEntities, metadata: { count }};
  };

  const getLegalEntity = async ({ id }: IdProp, { bypassKeyCheck = false }: BypassKeyCheck = {}, txOrPool: TxOrPool = pool) => {
    const keys = extractKeys(u, "serviceCentre", "legalEntity");

    const [ client ] = await db.sql<s.legalEntities.SQL | s.providers.SQL | s.serviceCentres.SQL, s.legalEntities.Selectable[]>`
      SELECT main.*, p.${'name'} AS provider, s.${'name'} AS "serviceCentre" 
      FROM ${'legalEntities'} AS main
      LEFT JOIN ${'providers'} AS p ON main.${'providerId'} = p.${'id'}
      LEFT JOIN ${'serviceCentres'} AS s ON main.${'serviceCentreId'} = s.${'id'}
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
    getLegalEntity,
    getLegalEntityByName,
    searchLegalEntities,
    countLegalEntities,
    listLegalEntities,
    listLegalEntitiesForKeys
  };
};

export default Service;