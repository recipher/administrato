import type * as s from 'zapatos/schema';
import * as db from 'zapatos/db';
import pool from '../db.server';

import ServiceCentreService from './service-centres.server';

import type { SecurityKey, SearchOptions as BaseSearchOptions, Count,
  QueryOptions, IdProp, KeyQueryOptions } from '../types';
import { ASC, DESC } from '../types';
  
import { type User } from '../access/users.server';

import { whereKeys, whereExactKeys, extractKeys } from './shared.server';

export type Provider = s.providers.Selectable;

type SearchOptions = {
  serviceCentreId?: number;
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
    const withKey = { ...provider, ...key };

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

  const searchQuery = ({ search }: SearchOptions) =>
    search == null ? db.sql<db.SQL>`` : db.sql<db.SQL>`
      LOWER(${'providers'}.${'name'}) LIKE LOWER('${db.raw(search)}%') AND `;

  const countProviders = async ({ search }: SearchOptions) => {
    const keys = extractKeys(u, "serviceCentre", "provider");
    const [ item ] = await db.sql<s.providers.SQL, s.providers.Selectable[]>`
      SELECT COUNT(${'id'}) AS count FROM ${'providers'}
      WHERE ${whereKeys({ keys })} ${searchQuery({ search })} 
    `.run(pool);

    const { count } = item as unknown as Count;
    return count;
  };

  const searchProviders = async ({ search }: SearchOptions, { offset = 0, limit = 8, sortDirection = ASC }: QueryOptions) => {  
    const keys = extractKeys(u, "serviceCentre", "provider");
    if (sortDirection == null || (sortDirection !== ASC && sortDirection !== DESC)) sortDirection = ASC;

    const providers = await db.sql<s.providers.SQL, s.providers.Selectable[]>`
      SELECT * FROM ${'providers'}
      WHERE ${whereKeys({ keys })} ${searchQuery({ search })} 
      ORDER BY ${'providers'}.${'name'} ${db.raw(sortDirection)}
      OFFSET ${db.param(offset)}
      LIMIT ${db.param(limit)}
      `.run(pool);
    const count = await countProviders({ search });

    return { providers, metadata: { count }};
  };

  const getProvider = async ({ id }: IdProp) => {
    const keys = extractKeys(u, "serviceCentre", "provider");
    const [ client ] = await db.sql<s.providers.SQL, s.providers.Selectable[]>`
      SELECT * FROM ${'providers'}
      WHERE ${whereKeys({ keys })} AND ${'id'} = ${db.param(id)}
      `.run(pool);

    return client;
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
    searchProviders,
    countProviders,
    listProviders,
    listProvidersForKeys
  };
};

export default service;