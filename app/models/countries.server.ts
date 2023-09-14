import { HolidayAPI } from 'holidayapi';
import type * as s from 'zapatos/schema';
import * as db from 'zapatos/db';
import pool from './db.server';

import type { QueryOptions, Count, SearchOptions } from './types';
import { ASC, DESC } from './types';

import { type User } from './access/users.server';

const key = process.env.HOLIDAY_API_KEY as string;
const holidayAPI = new HolidayAPI({ key });

export type Country = s.localities.Selectable & { regionCount: number | undefined };

type IsoCodeOptions = {
  isoCode: string;
};

type IsoCodesOptions = {
  isoCodes: Array<string>;
};

type ParentOptions = {
  parent: string;
};

const service = (u?: User) => {
  const getCountry = async ({ isoCode }: IsoCodeOptions) => {
    const [ country ] = await db.sql<s.localities.SQL, s.localities.Selectable[]>`
      SELECT * FROM ${'localities'} WHERE ${{isoCode}} 
    `.run(pool);

    return country;
  };

  const getCountries = async ({ isoCodes }: IsoCodesOptions) => {
    if (isoCodes.length === 0) return [];
    const codes = isoCodes.map(code => `'${code}'`).join(',');
    return db.sql<s.localities.SQL, s.localities.Selectable[]>`
      SELECT ${'localities'}.*, p.name AS "parentName" FROM ${'localities'} 
      LEFT JOIN ${'localities'} AS p ON ${'localities'}.${'parent'} = p.${'isoCode'}
      WHERE ${'localities'}.${'isoCode'} IN (${db.raw(codes)})
    `.run(pool);
  };

  const getRegions = async ({ isoCodes }: IsoCodesOptions) => {
    if (isoCodes.length === 0) return [];
    const codes = isoCodes.map(code => `'${code}'`).join(',');
    return db.sql<s.localities.SQL, s.localities.Selectable[]>`
      SELECT r.* FROM ${'localities'} 
      LEFT JOIN ${'localities'} AS r ON ${'localities'}.${'isoCode'} = r.${'parent'}
      WHERE ${'localities'}.${'isoCode'} IN (${db.raw(codes)})
    `.run(pool);
  };

  const listCountries = async ({ offset = 0, limit = 8, sortDirection = ASC }: QueryOptions) => {  
    return searchCountries({ search: undefined }, { offset, limit, sortDirection });
  };

  const searchQuery = ({ search }: SearchOptions) => 
    search == null ? db.sql<db.SQL, any>`` : db.sql<db.SQL, any>`
      AND
        (LOWER(${'name'}) LIKE LOWER('${db.raw(search)}%') OR
        LOWER(${'isoCode'}) LIKE LOWER('${db.raw(search)}%'))
    `;

  const searchCountries = async ({ search }: SearchOptions, { offset = 0, limit = 8, sortDirection = ASC }: QueryOptions) => {  
    if (sortDirection == null || (sortDirection !== ASC && sortDirection !== DESC)) sortDirection = ASC;

    return await db.sql<s.localities.SQL, s.localities.Selectable[]>`
      SELECT ${'localities'}.*, COUNT(r.${'isoCode'}) AS "regionCount" FROM ${'localities'}
      LEFT JOIN ${'localities'} AS r ON ${'localities'}.${'isoCode'} = r.${'parent'}
      WHERE ${'localities'}.${'parent'} IS NULL ${searchQuery({ search })}
      GROUP BY ${'localities'}.${'isoCode'}
      ORDER BY ${'localities'}.${'name'} ${db.raw(sortDirection)}
      OFFSET ${db.param(offset)}
      LIMIT ${db.param(limit)}
    `.run(pool);
  };

  const countCountries = async ({ search }: SearchOptions) => {
    const [ item ] = await db.sql<s.localities.SQL, s.localities.Selectable[]>`
      SELECT COUNT(${'isoCode'}) AS count FROM ${'localities'}
      WHERE ${'parent'} IS NULL ${searchQuery({ search })}
    `.run(pool);

    const { count } = item as unknown as Count;
    return count;
  };

  const listRegionsByCountry = async ({ parent }: ParentOptions) => {
    return db.sql<s.localities.SQL, s.localities.Selectable[]>`
      SELECT * FROM ${'localities'} WHERE ${{parent}} ORDER BY ${'name'}`.run(pool);
  };

  const syncCountries = async () => {
    const { countries = [] } = await holidayAPI.countries();

    if (countries.length === 0) return;

    return Promise.all(countries.map(async country => {
      await db.upsert('localities', 
        { name: country.name, isoCode: country.code }, 'isoCode').run(pool);

      return db.upsert('localities', country.subdivisions.map(sub => (
        { name: sub.name, isoCode: sub.code, parent: country.code }
      )), 'isoCode').run(pool)
    }));
  };

  return {
    getCountry,
    getCountries,
    getRegions,
    listCountries,
    searchCountries,
    countCountries,
    listRegionsByCountry,
    syncCountries,
  };
};

export default service;