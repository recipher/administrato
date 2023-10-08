import { HolidayAPI } from 'holidayapi';
import type * as s from 'zapatos/schema';
import * as db from 'zapatos/db';
import pool from '../db.server';

export { default as create } from '../id.server';
import { default as create } from '../id.server';

import { isSameDay, isSameMonth, isSameYear } from 'date-fns';

const key = process.env.HOLIDAY_API_KEY as string;
const holidayAPI = new HolidayAPI({ key });

export type Holiday = s.holidays.Selectable;

import { type User } from '../access/users.server';

type ListOptions = { 
  year: number;
  locality: string;
};

type EntityOptions = {
  entity: string;
  entityId: string;
};

type OptionalEntityOptions = {
  entity: string | null;
  entityId: string | null;
};

type QueryOptions = { 
  shouldDelete?: boolean;
};

const isSameDate = (left: Date, right: Date) =>
  isSameDay(left, right) && isSameMonth(left, right) && isSameYear(left, right);
 
const service = (u: User) => {
  const addHoliday = async (holiday: s.holidays.Insertable) => {
    const [inserted] = await db.sql<s.holidays.SQL, s.holidays.Selectable[]>`
      INSERT INTO ${'holidays'} (${db.cols(holiday)})
      VALUES (${db.vals(holiday)}) RETURNING *`.run(pool);

    return inserted;
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
      if (holiday.entity) {
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
      ORDER BY ${'date'} ASC`.run(pool);
  };

  type customHolidaysSQL = 
    s.holidays.SQL | s.providers.SQL | s.clients.SQL | s.legalEntities.SQL | s.serviceCentres.SQL;

  const listCustomHolidaysByCountry = async ({ year, locality }: ListOptions) => {
    return db.sql<customHolidaysSQL, s.holidays.Selectable[]>`
      SELECT 
        ${'holidays'}.*, 
        ${'clients'}.${'name'} AS client,
        ${'providers'}.${'name'} AS provider,
        ${'legalEntities'}.${'name'} AS "legalEntity",
        ${'serviceCentres'}.${'name'} AS "serviceCentre"
      FROM ${'holidays'} 
      LEFT JOIN ${'clients'} ON ${'entityId'} = ${'clients'}.${'id'} AND ${'entity'} = 'client'
      LEFT JOIN ${'providers'} ON ${'entityId'} = ${'providers'}.${'id'} AND ${'entity'} = 'provider'
      LEFT JOIN ${'legalEntities'} ON ${'entityId'} = ${'legalEntities'}.${'id'} AND ${'entity'} = 'legal-entity'
      LEFT JOIN ${'serviceCentres'} ON ${'entityId'} = ${'serviceCentres'}.${'id'} AND ${'entity'} = 'service-centre'
      WHERE 
        ${{locality}} AND 
        ${'entityId'} IS NOT NULL AND (${'isRemoved'} IS NULL OR ${'isRemoved'} = FALSE) AND
        DATE_PART('year', ${'date'}) = ${db.param(year)}
      ORDER BY ${'date'} ASC`.run(pool);
  };

  const listHolidaysByCountryForEntity = async ({ year, locality, entity, entityId }: ListOptions & EntityOptions) => {
    const holidays = await db.sql<s.holidays.SQL, s.holidays.Selectable[]>`
      SELECT * FROM ${'holidays'} 
      WHERE 
        ${{locality}} AND 
        ${'entityId'} IS NULL AND 
        DATE_PART('year', ${'date'}) = ${db.param(year)}
      UNION ALL
      SELECT * from ${'holidays'}
      WHERE 
        ${{locality}} AND 
        ${{entity}} AND ${{entityId}} AND
        DATE_PART('year', ${'date'}) = ${db.param(year)}
      ORDER BY ${'date'} ASC`.run(pool);

    return holidays.reduce((holidays: Array<Holiday>, holiday: Holiday) => {
      const existing = holidays.find(h => isSameDate(h.date, holiday.date));
      if (existing) {
        return (existing.entity) ? holidays : [ ...holidays.filter(h => h.id !== existing.id), holiday ];
      }
      return [ ...holidays, holiday ]; 
    }, []);
  };

  const syncHolidays = async ({ year, locality }: ListOptions, { shouldDelete = false }: QueryOptions = {}) => {
    if (shouldDelete) await deleteHolidaysByCountry({ year, locality });

    const { holidays = [] } = await holidayAPI.holidays({ country: locality, year, public: true });

    if (holidays.length === 0) return;

    await db.insert('holidays', holidays.map(holiday => (
      create({ name: holiday.name, 
        date: new Date(holiday.date), 
        observed: new Date(holiday.observed), 
        locality: holiday.country })
    ))).run(pool);

    return listHolidaysByCountry({ year, locality });
  };

  return {
    addHoliday,
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

export default service;