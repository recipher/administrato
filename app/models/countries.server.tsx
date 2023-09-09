import { HolidayAPI } from 'holidayapi';
import type * as s from 'zapatos/schema';
import * as db from 'zapatos/db';
import pool from './db.server';

import { type QueryOptions, type SearchOptions, ASC, DESC } from './types';

const key = process.env.HOLIDAY_API_KEY as string;
const holidayAPI = new HolidayAPI({ key });

export type Country = s.localities.Selectable;

type Count = {
  count: number;
};

type IsoCodeOptions = {
  isoCode: string;
};

type IsoCodesOptions = {
  isoCodes: Array<string>;
};

export const getCountry = async ({ isoCode }: IsoCodeOptions) => {
  const [ country ] = await db.sql<s.localities.SQL, s.localities.Selectable[]>`
    SELECT * FROM ${'localities'} WHERE ${{isoCode}} 
  `.run(pool);

  return country;
};

export const getCountries = async ({ isoCodes }: IsoCodesOptions) => {
  const codes = isoCodes.map(code => `'${code}'`).join(',');
  return db.sql<s.localities.SQL, s.localities.Selectable[]>`
    SELECT ${'localities'}.*, p.name AS "parentName" FROM ${'localities'} 
    LEFT JOIN ${'localities'} AS p ON ${'localities'}.${'parent'} = p.${'isoCode'}
    WHERE ${'localities'}.${'isoCode'} IN (${db.raw(codes)})
  `.run(pool);
};

export const listCountries = async ({ offset = 0, limit = 8, sortDirection = ASC }: QueryOptions) => {  
  return searchCountries({ search: undefined }, { offset, limit, sortDirection });
};

export const searchCountries = async ({ search }: SearchOptions, { offset = 0, limit = 8, sortDirection = ASC }: QueryOptions) => {  
  const searchQuery = search == null ? db.sql<db.SQL, any>`` : db.sql<db.SQL, any>`
     AND
      (LOWER(${'localities'}.${'name'}) LIKE LOWER('${db.raw(search)}%') OR
       LOWER(${'localities'}.${'isoCode'}) LIKE LOWER('${db.raw(search)}%'))
  `;

  if (sortDirection == null || (sortDirection !== ASC && sortDirection !== DESC)) sortDirection = ASC;

  return await db.sql<s.localities.SQL, s.localities.Selectable[]>`
    SELECT ${'localities'}.*, COUNT(r.${'isoCode'}) AS regions FROM ${'localities'}
    LEFT JOIN ${'localities'} AS r ON ${'localities'}.${'isoCode'} = r.${'parent'}
    WHERE ${'localities'}.${'parent'} IS NULL ${searchQuery}
    GROUP BY ${'localities'}.${'isoCode'}
    ORDER BY ${'localities'}.${'name'} ${db.raw(sortDirection)}
    OFFSET ${db.raw(offset.toString())}
    LIMIT ${db.raw(limit.toString())}
  `.run(pool);
};

export const countCountries = async ({ search }: SearchOptions) => {
  const searchQuery = search == null ? db.sql<db.SQL, any>`` : db.sql<db.SQL, any>`
     AND
      (LOWER(${'name'}) LIKE LOWER('${db.raw(search)}%') OR
       LOWER(${'isoCode'}) LIKE LOWER('${db.raw(search)}%'))
  `;
  const [ item ] = await db.sql<s.localities.SQL, s.localities.Selectable[]>`
    SELECT COUNT(${'isoCode'}) AS count FROM ${'localities'}
    WHERE ${'parent'} IS NULL ${searchQuery}
  `.run(pool);

  const { count } = item as unknown as Count;
  return count;
};


type ParentOptions = {
  parent: string;
};

export const listRegionsByCountry = async ({ parent }: ParentOptions) => {
  return db.sql<s.localities.SQL, s.localities.Selectable[]>`
    SELECT * FROM ${'localities'} WHERE ${{parent}} ORDER BY ${'name'}`.run(pool);
};

export const syncCountries = async () => {
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
