import { HolidayAPI } from 'holidayapi';
import type * as s from 'zapatos/schema';
import * as db from 'zapatos/db';
import pool from '../db.server';

import { format } from 'date-fns';
import { isSameDate } from './date';

import { type User } from '../access/users.server';
import { TxOrPool } from '../types';

export { default as create } from '../id.server';
import { default as create } from '../id.server';

const key = process.env.HOLIDAY_API_KEY as string;
const holidayAPI = new HolidayAPI({ key });

export type Holiday = s.holidays.Selectable;

type ListOptions = { 
  month?: number | undefined | null;
  year?: number | undefined;
  start?: Date | undefined;
  end?: Date | undefined;
  locality: string;
};

type EntityOptions = {
  entityId: string;
};

type OptionalEntityOptions = {
  entity: string | null;
  entityId: string | null;
};

type QueryOptions = { 
  shouldDelete?: boolean;
};
 
const Service = (u: User) => {
  const addHoliday = async (data: s.holidays.Insertable) => {
    const holiday = { ...data, createdBy: u };
    const [inserted] = await db.sql<s.holidays.SQL, s.holidays.Selectable[]>`
      INSERT INTO ${'holidays'} (${db.cols(holiday)})
      VALUES (${db.vals(holiday)}) RETURNING *`.run(pool);

    return inserted;
  };

  const addHolidays = async (holidays: Array<s.holidays.Insertable>, txOrPool: TxOrPool = pool) => {
    return db.upsert('holidays', holidays.map(h => ({ ...h, updatedBy: u })), 
      [ 'name', 'date', 'locality', 'entity', 'entityId' ]).run(txOrPool);
  };

  const getHolidayById = async ({ id }: { id: string }) => {
    const [ holiday ] = await db.sql<s.holidays.SQL, s.holidays.Selectable[]>`
      SELECT * FROM ${'holidays'} 
      WHERE ${{id}}`.run(pool);
    return holiday;
  };

  const deleteHolidayById = async (id: string, entity?: OptionalEntityOptions) => {
    if (entity) {
      const { name, date, locality, ...holiday } = await getHolidayById({ id });
      if (!holiday.entity) {
        return addHoliday(create({ name, date, locality, isRemoved: true, ...entity }));
      }
    }
    return db.sql<s.holidays.SQL>`DELETE FROM ${'holidays'} WHERE ${{id}}`.run(pool);
  };

  const reinstateHolidayById = async (id: string, entity: EntityOptions) => {
    if (entity) {
      const holiday = await getHolidayById({ id });
      if (holiday.entityId) {
        return db.sql<s.holidays.SQL>`DELETE FROM ${'holidays'} WHERE ${{id}}`.run(pool);
      }
    }
  };

  const deleteHolidaysByCountry = async ({ year, locality }: ListOptions) => {
    return db.sql<s.holidays.SQL>`
      DELETE FROM ${'holidays'} 
      WHERE 
        ${{locality}} AND 
        ${'entityId'} IS NULL AND 
        DATE_PART('year', ${'date'}) = ${db.param(year)}`
      .run(pool);
  };

  const listHolidaysByCountry = async ({ year, locality }: ListOptions) => {
    return db.sql<s.holidays.SQL, s.holidays.Selectable[]>`
      SELECT * FROM ${'holidays'} 
      WHERE 
        ${{locality}} AND 
        ${'entityId'} IS NULL AND 
        DATE_PART('year', ${'date'}) = ${db.param(year)}
      ORDER BY ${'date'} ASC`
    .run(pool);
  };

  type customHolidaysSQL = 
    s.holidays.SQL | s.providers.SQL | s.clients.SQL | s.legalEntities.SQL | s.securityGroups.SQL;

  const listCustomHolidaysByCountry = async ({ year, locality }: ListOptions) => {
    return db.sql<customHolidaysSQL, s.holidays.Selectable[]>`
      SELECT 
        ${'holidays'}.*, 
        ${'clients'}.${'name'} AS client,
        ${'providers'}.${'name'} AS provider,
        ${'legalEntities'}.${'name'} AS "legalEntity",
        ${'securityGroups'}.${'name'} AS "securityGroup"
      FROM ${'holidays'} 
      LEFT JOIN ${'clients'} ON ${'entityId'} = ${'clients'}.${'id'} AND ${'entity'} = 'client'
      LEFT JOIN ${'providers'} ON ${'entityId'} = ${'providers'}.${'id'} AND ${'entity'} = 'provider'
      LEFT JOIN ${'legalEntities'} ON ${'entityId'} = ${'legalEntities'}.${'id'} AND ${'entity'} = 'legal-entity'
      LEFT JOIN ${'securityGroups'} ON ${'entityId'} = ${'securityGroups'}.${'id'} AND ${'entity'} = 'security-group'
      WHERE 
        ${{locality}} AND 
        ${'entityId'} IS NOT NULL AND  
        ${'entity'} IN ('security-group', 'legal-entity', 'client', 'provider') AND 
        (${'isRemoved'} IS NULL OR ${'isRemoved'} = FALSE) AND
        DATE_PART('year', ${'date'}) = ${db.param(year)}
      ORDER BY ${'date'} ASC`
    .run(pool);
  };
  
  const listHolidaysByCountryForEntity = async ({ month, year, start, end, locality, entityId }: ListOptions & EntityOptions, { includeMain }: { includeMain: boolean } = { includeMain: true }, txOrPool: TxOrPool = pool) => {
    const byYear = year === undefined ? db.sql`` 
      : db.sql`DATE_PART('year', ${'date'}) = ${db.param(year)}`;
    const byMonth = month === undefined ? db.sql`` 
      : db.sql`AND DATE_PART('month', ${'date'}) = ${db.param(month)}`;
    const byRange = start === undefined || end === undefined ? db.sql`` 
      : db.sql`AND ${'date'}) BETWEEN ${db.param(format(start, 'yyyy-MM-dd'))} AND ${db.param(format(end, 'yyyy-MM-dd'))}`;
    
    const main = db.sql<s.holidays.SQL>`
      SELECT * FROM ${'holidays'} 
      WHERE 
        ${{locality}} AND ${'entityId'} IS NULL AND 
        ${byYear} ${byMonth} ${byRange}
    `;

    const entity = db.sql<s.holidays.SQL>`
      SELECT * from ${'holidays'}
      WHERE 
        ${{locality}} AND ${{entityId}} AND
        ${byYear} ${byMonth} ${byRange}
    `;

    if (includeMain === false) 
      return db.sql`${entity} ORDER BY ${'date'} ASC`.run(txOrPool);

    const holidays = await db.sql<s.holidays.SQL, s.holidays.Selectable[]>`
      ${main} UNION ALL ${entity}
      ORDER BY ${'date'} ASC`
    .run(txOrPool);

    return holidays.reduce((holidays: Array<Holiday>, holiday: Holiday) => {
      const existing = holidays.find(h => isSameDate(h.date, holiday.date));
      if (existing) {
        return (existing.entity) ? holidays : [ ...holidays.filter(h => h.id !== existing.id), holiday ];
      }
      return [ ...holidays, holiday ]; 
    }, []);
  };
  
  const syncHolidays = async ({ year = new Date().getUTCFullYear(), locality }: ListOptions, { shouldDelete = false }: QueryOptions = {}) => {
    if (shouldDelete) await deleteHolidaysByCountry({ year, locality });

    const { holidays = [] } = await holidayAPI.holidays({ country: locality, year, public: true });

    if (holidays.length === 0) return;

    await db.insert('holidays', holidays.map(holiday => (
      create({ 
        name: holiday.name, 
        date: new Date(holiday.date), 
        observed: new Date(holiday.observed), 
        locality: holiday.country,
        createdBy: u
      })
    ))).run(pool);

    return listHolidaysByCountry({ year, locality });
  };

  return {
    addHoliday,
    addHolidays,
    deleteHolidayById,
    reinstateHolidayById,
    deleteHolidaysByCountry,
    getHolidayById,
    listHolidaysByCountry,
    listCustomHolidaysByCountry,
    listHolidaysByCountryForEntity,
    syncHolidays,
  };
};

export default Service;
