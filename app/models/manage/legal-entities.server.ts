import type * as s from 'zapatos/schema';
import * as db from 'zapatos/db';
import pool from '../db.server';

import ServiceCentreService from './service-centres.server';

import type { SecurityKey, SearchOptions as BaseSearchOptions, Count,
  QueryOptions, IdProp, NameProp, KeyQueryOptions, BypassKeyCheck } from '../types';
import { ASC, DESC } from '../types';
  
import { type User } from '../access/users.server';

import { whereKeys, whereExactKeys, extractKeys, generateIdentifier } from './shared.server';

export type LegalEntity = s.legalEntities.Selectable;

type SearchOptions = {
  serviceCentreId?: number | undefined;
} & BaseSearchOptions;

const service = (u: User) => {
  const getLatest = async (legalEntity: s.legalEntities.Insertable) => {
    const query = db.sql<db.SQL>`${'serviceCentreId'} = ${db.param(legalEntity.serviceCentreId)}`;

    const [ latest ] = await db.sql<s.legalEntities.SQL, s.legalEntities.Selectable[]>`
      SELECT * FROM ${'legalEntities'}
      WHERE ${'keyEnd'} IS NOT NULL AND ${query}
      ORDER BY ${'keyEnd'} DESC
      LIMIT 1
      `.run(pool);
    return latest;
  };

  const generateKey = async (legalEntity: s.legalEntities.Insertable): Promise<SecurityKey> => {
    const service = ServiceCentreService(u);

    const parent = await service.getServiceCentre({ id: legalEntity.serviceCentreId as number })
    const maxEntities = 10000; // Move to constants
    const latest = await getLatest(legalEntity);

    if (parent === undefined) throw new Error('Error generating security key');

    const keyStart = Number(latest?.keyEnd ? Number(latest.keyEnd) + 1 : parent.keyStart);
    const keyEnd = keyStart + Number(Math.round(parent.keyEnd as unknown as number / maxEntities));

    return { keyStart, keyEnd };
  };

  const addLegalEntity = async (legalEntity: s.legalEntities.Insertable) => {
    const key = await generateKey(legalEntity);
    const withKey = { ...legalEntity, ...key, identifier: generateIdentifier(legalEntity) };

    const [inserted] = await db.sql<s.legalEntities.SQL, s.legalEntities.Selectable[]>`
      INSERT INTO ${'legalEntities'} (${db.cols(withKey)})
      VALUES (${db.vals(withKey)}) RETURNING *`.run(pool);

    return inserted;
  };

  const listLegalEntities = async (query: KeyQueryOptions = { isArchived: false }) => {
    const keys = query.keys || extractKeys(u, "serviceCentre", "legalEntity"); 
    return await db.sql<s.legalEntities.SQL, s.legalEntities.Selectable[]>`
      SELECT * FROM ${'legalEntities'}
      WHERE ${whereKeys({ keys, ...query })}
      `.run(pool);
  };

  const searchQuery = ({ search, serviceCentreId }: SearchOptions) => {
    const name = search == null ? db.sql<db.SQL>`${'name'} IS NOT NULL` : db.sql<db.SQL>`
      LOWER(${'legalEntities'}.${'name'}) LIKE LOWER('${db.raw(search)}%')`;

    return serviceCentreId === undefined ? name
      : db.sql<db.SQL>`${name} AND ${'serviceCentreId'} = ${db.param(serviceCentreId)}`; 
  };

  const countLegalEntities = async (search: SearchOptions) => {
    const keys = extractKeys(u, "serviceCentre", "legalEntity");
    const [ item ] = await db.sql<s.legalEntities.SQL, s.legalEntities.Selectable[]>`
      SELECT COUNT(${'id'}) AS count FROM ${'legalEntities'}
      WHERE ${searchQuery(search)} AND ${whereKeys({ keys })}  
    `.run(pool);

    const { count } = item as unknown as Count;
    return count;
  };

  const searchLegalEntities = async (search: SearchOptions, { offset = 0, limit = 8, sortDirection = ASC }: QueryOptions) => {  
    const keys = extractKeys(u, "serviceCentre", "legalEntity");
    if (sortDirection == null || (sortDirection !== ASC && sortDirection !== DESC)) sortDirection = ASC;

    const legalEntities = await db.sql<s.legalEntities.SQL, s.legalEntities.Selectable[]>`
      SELECT * FROM ${'legalEntities'}
      WHERE ${searchQuery(search)} AND ${whereKeys({ keys })}  
      ORDER BY ${'legalEntities'}.${'name'} ${db.raw(sortDirection)}
      OFFSET ${db.param(offset)}
      LIMIT ${db.param(limit)}
      `.run(pool);
    const count = await countLegalEntities(search);

    return { legalEntities, metadata: { count }};
  };

  const getLegalEntity = async ({ id }: IdProp, { bypassKeyCheck = false }: BypassKeyCheck = {}) => {
    const keys = extractKeys(u, "serviceCentre", "legalEntity");
    const numericId = isNaN(parseInt(id as string)) ? 0 : id;

    const [ client ] = await db.sql<s.legalEntities.SQL, s.legalEntities.Selectable[]>`
      SELECT * FROM ${'legalEntities'}
      WHERE ${whereKeys({ keys, bypassKeyCheck })} AND  
        (${'id'} = ${db.param(numericId)} OR LOWER(${'identifier'}) = ${db.param(id.toString().toLowerCase())})
      `.run(pool);

    return client;
  };

  const getLegalEntityByName = async ({ name }: NameProp, { bypassKeyCheck = false }: BypassKeyCheck = {}) => {
    const keys = u.keys.legalEntity;

    const [ legalEntity ] = await db.sql<s.legalEntities.SQL, s.legalEntities.Selectable[]>`
      SELECT * FROM ${'legalEntities'}
      WHERE ${whereKeys({ keys, bypassKeyCheck })} AND LOWER(${'name'}) = ${db.param(name.toLowerCase())}
      `.run(pool);

    return legalEntity;
  };

  // Required to determine exactly which entities a user has authorization for
  const listLegalEntitiesForKeys = async ({ keys }: KeyQueryOptions) => {
    if (keys === undefined) return [];
    return await db.sql<s.legalEntities.SQL, s.legalEntities.Selectable[]>`
      SELECT * FROM ${'legalEntities'}
      WHERE ${whereExactKeys({ keys })}
      `.run(pool);
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

export default service;