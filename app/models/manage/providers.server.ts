import type * as s from 'zapatos/schema';
import * as db from 'zapatos/db';
import pool from '../db.server';

import ServiceCentreService from './service-centres.server';

import type { SecurityKey, SearchOptions as BaseSearchOptions, Count,
  QueryOptions, IdProp, NameProp, KeyQueryOptions, BypassKeyCheck } from '../types';
import { ASC, DESC } from '../types';
  
import { type User } from '../access/users.server';

import { whereKeys, whereExactKeys, extractKeys, generateIdentifier } from './shared.server';

export type Provider = s.providers.Selectable;

type SearchOptions = {
  serviceCentreId?: number | undefined;
} & BaseSearchOptions;

const service = (u: User) => {
  const getLatest = async (provider: s.providers.Insertable) => {
    const query = db.sql<db.SQL>`${'serviceCentreId'} = ${db.param(provider.serviceCentreId)}`;

    const [ latest ] = await db.sql<s.providers.SQL, s.providers.Selectable[]>`
      SELECT * FROM ${'providers'}
      WHERE ${'keyEnd'} IS NOT NULL AND ${query}
      ORDER BY ${'keyEnd'} DESC
      LIMIT 1
      `.run(pool);
    return latest;
  };

  const generateKey = async (provider: s.providers.Insertable): Promise<SecurityKey> => {
    const service = ServiceCentreService(u);

    const parent = await service.getServiceCentre({ id: provider.serviceCentreId as number })
    const maxEntities = 10000; // Move to constants
    const latest = await getLatest(provider);

    if (parent === undefined) throw new Error('Error generating security key');

    const keyStart = Number(latest?.keyEnd ? Number(latest.keyEnd) + 1 : parent.keyStart);
    const keyEnd = keyStart + Number(Math.round(parent.keyEnd as unknown as number / maxEntities));

    return { keyStart, keyEnd };
  };

  const addProvider = async (provider: s.providers.Insertable) => {
    const key = await generateKey(provider);
    const withKey = { ...provider, ...key, identifier: generateIdentifier(provider) };

    const [inserted] = await db.sql<s.providers.SQL, s.providers.Selectable[]>`
      INSERT INTO ${'providers'} (${db.cols(withKey)})
      VALUES (${db.vals(withKey)}) RETURNING *`.run(pool);

    return inserted;
  };

  const listProviders = async (query: KeyQueryOptions = { isArchived: false }) => {
    const keys = query.keys || extractKeys(u, "serviceCentre", "provider"); 
    return await db.sql<s.providers.SQL, s.providers.Selectable[]>`
      SELECT * FROM ${'providers'}
      WHERE ${whereKeys({ keys, ...query })}
      `.run(pool);
  };

  const searchQuery = ({ search, serviceCentreId }: SearchOptions) => {
    const name = search == null ? db.sql<db.SQL>`${'name'} IS NOT NULL` : db.sql<db.SQL>`
      LOWER(${'providers'}.${'name'}) LIKE LOWER('${db.raw(search)}%')`;

    return serviceCentreId === undefined ? name
      : db.sql<db.SQL>`${name} AND ${'serviceCentreId'} = ${db.param(serviceCentreId)}`; 
  };

  const countProviders = async (search: SearchOptions) => {
    const keys = extractKeys(u, "serviceCentre", "provider");
    const [ item ] = await db.sql<s.providers.SQL, s.providers.Selectable[]>`
      SELECT COUNT(${'id'}) AS count FROM ${'providers'}
      WHERE ${searchQuery(search)} AND ${whereKeys({ keys })}  
    `.run(pool);

    const { count } = item as unknown as Count;
    return count;
  };

  const searchProviders = async (search: SearchOptions, { offset = 0, limit = 8, sortDirection = ASC }: QueryOptions) => {  
    const keys = extractKeys(u, "serviceCentre", "provider");
    if (sortDirection == null || (sortDirection !== ASC && sortDirection !== DESC)) sortDirection = ASC;

    const providers = await db.sql<s.providers.SQL, s.providers.Selectable[]>`
      SELECT * FROM ${'providers'}
      WHERE ${searchQuery(search)} AND ${whereKeys({ keys })}  
      ORDER BY ${'providers'}.${'name'} ${db.raw(sortDirection)}
      OFFSET ${db.param(offset)}
      LIMIT ${db.param(limit)}
      `.run(pool);
    const count = await countProviders(search);

    return { providers, metadata: { count }};
  };

  const getProvider = async ({ id }: IdProp, { bypassKeyCheck = false }: BypassKeyCheck = {}) => {
    const keys = extractKeys(u, "serviceCentre", "provider");
    const numericId = isNaN(parseInt(id as string)) ? 0 : id;

    const [ provider ] = await db.sql<s.providers.SQL, s.providers.Selectable[]>`
      SELECT * FROM ${'providers'}
      WHERE ${whereKeys({ keys, bypassKeyCheck })} AND  
        (${'id'} = ${db.param(numericId)} OR LOWER(${'identifier'}) = ${db.param(id.toString().toLowerCase())})
      `.run(pool);

    return provider;
  };

  const getProviderByName = async ({ name }: NameProp, { bypassKeyCheck = false }: BypassKeyCheck = {}) => {
    const keys = u.keys.provider;

    const [ provider ] = await db.sql<s.providers.SQL, s.providers.Selectable[]>`
      SELECT * FROM ${'providers'}
      WHERE ${whereKeys({ keys, bypassKeyCheck })} AND LOWER(${'name'}) = ${db.param(name.toLowerCase())}
      `.run(pool);

    return provider;
  };

  // Required to determine exactly which entities a user has authorization for
  const listProvidersForKeys = async ({ keys }: KeyQueryOptions) => {
    if (keys === undefined) return [];
    return await db.sql<s.providers.SQL, s.providers.Selectable[]>`
      SELECT * FROM ${'providers'}
      WHERE ${whereExactKeys({ keys })}
      `.run(pool);
  };

  return {
    addProvider,
    getProvider,
    getProviderByName,
    searchProviders,
    countProviders,
    listProviders,
    listProvidersForKeys
  };
};

export default service;