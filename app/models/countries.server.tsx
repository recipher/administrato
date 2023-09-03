import { HolidayAPI } from 'holidayapi';
import type * as s from 'zapatos/schema';
import * as db from 'zapatos/db';
import pool from './db.server';
import Sort from '~/components/header/sort';

const key = process.env.HOLIDAY_API_KEY as string;
const holidayAPI = new HolidayAPI({ key });

type Country = {
  name: string;
  isoCode: string;
};

type Count = {
  count: number;
};

export const getCountry = async (isoCode: string) => {
  const [ country ] = await db.sql<s.localities.SQL, s.localities.Selectable[]>`
    SELECT * FROM ${'localities'} WHERE ${{isoCode}} 
  `.run(pool);

  return country;
};

type ListParams = {
  search: string | null | undefined;
  offset: number | undefined;
  limit: number | undefined;
  sortDirection: string | null;
};

const ASC = 'asc', DESC = 'desc';

export const listCountries = async ({ search, offset = 0, limit = 8, sortDirection }: ListParams) => {  
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

export const countCountries = async ({ search }: { search: string | null | undefined }) => {
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

export const listRegionsByCountry = async (parent: string) => {
  return await db.sql<s.localities.SQL, s.localities.Selectable[]>`
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
