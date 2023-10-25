import { HolidayAPI } from 'holidayapi';
import type * as s from 'zapatos/schema';
import * as db from 'zapatos/db';
import pool from './db.server';
import arc from '@architect/functions';

import countryData from './data/countries.json';

import type { QueryOptions, Count, SearchOptions } from './types';
import { ASC, DESC } from './types';

import { type User } from './access/users.server';

const key = process.env.HOLIDAY_API_KEY as string;
const holidayAPI = new HolidayAPI({ key });

export type Country = s.localities.Selectable & { 
  regionCount?: number | undefined;
  parentName?: string | undefined;
};

type IsoCodeOptions = {
  isoCode: string;
};

type IsoCodesOptions = {
  isoCodes: Array<string>;
};

type ParentOptions = {
  parent: string;
};

const Service = (u?: User) => {
  const getCountry = async ({ isoCode }: IsoCodeOptions) => {
    const [ country ] = await db.sql<s.localities.SQL, s.localities.Selectable[]>`
      SELECT * FROM ${'localities'} WHERE ${{isoCode}} 
    `.run(pool);

    return country;
  };

  const getIsoCodes = async({ isoCodes }: IsoCodesOptions) => {
    if (isoCodes.length === 0) return [];
    const codes = isoCodes.map(code => `'${code}'`).join(',');

    const localities = await db.sql<s.localities.SQL, s.localities.Selectable[]>`
      SELECT ${'localities'}.${'isoCode'}, p.${'isoCode'} AS "parentIsoCode" 
      FROM ${'localities'} 
      LEFT JOIN ${'localities'} AS p 
      ON ${'localities'}.${'parent'} = p.${'isoCode'}
      WHERE ${'localities'}.${'isoCode'} IN (${db.raw(codes)})
    `.run(pool);

    return localities.map((locality: any) => {
      return locality.parentIsoCode || locality.isoCode;
    });
  };

  const getCountries = async ({ isoCodes }: IsoCodesOptions) => {
    if (isoCodes.length === 0) return [];
    const codes = isoCodes.map(code => `'${code}'`).join(',');
    return db.sql<s.localities.SQL, s.localities.Selectable[]>`
      SELECT ${'localities'}.*, p.${'name'} AS "parentName" FROM ${'localities'} 
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
        (LOWER(${'localities'}.${'name'}) LIKE LOWER(${db.param(`${search}%`)}) OR
        LOWER(${'localities'}.${'isoCode'}) LIKE LOWER(${db.param(`${search}%`)}))
    `;

  const countCountries = async ({ search }: SearchOptions) => {
    const [ item ] = await db.sql<s.localities.SQL, s.localities.Selectable[]>`
      SELECT COUNT(${'isoCode'}) AS count FROM ${'localities'}
      WHERE ${'parent'} IS NULL ${searchQuery({ search })}
    `.run(pool);

    const { count } = item as unknown as Count;
    return count;
  };

  const searchCountries = async ({ search }: SearchOptions, { offset = 0, limit = 8, sortDirection = ASC }: QueryOptions) => {  
    if (sortDirection == null || (sortDirection !== ASC && sortDirection !== DESC)) sortDirection = ASC;

    const countries = await db.sql<s.localities.SQL, s.localities.Selectable[]>`
      SELECT ${'localities'}.*, COUNT(r.${'isoCode'}) AS "regionCount" FROM ${'localities'}
      LEFT JOIN ${'localities'} AS r ON ${'localities'}.${'isoCode'} = r.${'parent'}
      WHERE ${'localities'}.${'parent'} IS NULL ${searchQuery({ search })}
      GROUP BY ${'localities'}.${'isoCode'}
      ORDER BY ${'localities'}.${'name'} ${db.raw(sortDirection)}
      OFFSET ${db.param(offset)}
      LIMIT ${db.param(limit)}
      `.run(pool);
    const count = await countCountries({ search });

    return { countries, metadata: { count }};
  };

  const listRegionsByCountry = async ({ parent }: ParentOptions) => {
    return db.sql<s.localities.SQL, s.localities.Selectable[]>`
      SELECT * FROM ${'localities'} WHERE ${{parent}} ORDER BY ${'name'}`.run(pool);
  };

  const publish = ({ country, regions }: { country: string, regions: Array<string> }) => {
    if ([ 'FR', 'DE', 'ES', 'GB' ].includes(country) === false) return;

    arc.queues.publish({
      name: 'country-added',
      payload: { country, regions, meta: { user: u }},
    });
  };

  const syncCountries = async () => {
    const { countries = [] } = await holidayAPI.countries();

    if (countries.length === 0) return;

    return Promise.all(countries.map(async country => {
      const data = countryData.find(c => c.isoCode === country.code);
      await db.upsert('localities', 
        { name: country.name, isoCode: country.code, diallingCode: data?.diallingCode as string }, 'isoCode').run(pool);

      publish({ country: country.code, regions: country.subdivisions.map(sub => sub.code) });

      return db.upsert('localities', country.subdivisions.map(sub => (
        { name: sub.name, isoCode: sub.code, parent: country.code }
      )), 'isoCode').run(pool);
    }));
  };

  return {
    getCountry,
    getCountries,
    getRegions,
    getIsoCodes,
    listCountries,
    searchCountries,
    countCountries,
    listRegionsByCountry,
    syncCountries,
  };
};

export default Service;