import { HolidayAPI } from 'holidayapi';
import type * as s from 'zapatos/schema';
import * as db from 'zapatos/db';
import pool from '../db.server';

const key = process.env.HOLIDAY_API_KEY as string;
const holidayAPI = new HolidayAPI({ key });

export type Holiday = s.holidays.Selectable;

type ListOptions = { 
  year: number;
  locality: string;
};

type EntityOptions = {
  entity: string;
  entityId: number;
};

type QueryOptions = { 
  shouldDelete?: boolean;
};

const service = () => {
  const addHoliday = async (holiday: s.holidays.Insertable) => {
    const [inserted] = await db.sql<s.holidays.SQL, s.holidays.Selectable[]>`
      INSERT INTO ${'holidays'} (${db.cols(holiday)})
      VALUES (${db.vals(holiday)}) RETURNING *`.run(pool);

    return inserted;
  };

  const deleteHolidayById = async (id: number) => {
    return db.sql<s.holidays.SQL>`
      DELETE FROM ${'holidays'} WHERE ${{id}}`
      .run(pool);
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
  };

  const syncHolidays = async ({ year, locality }: ListOptions, { shouldDelete = false }: QueryOptions = {}) => {
    if (shouldDelete) await deleteHolidaysByCountry({ year, locality });

    const { holidays = [] } = await holidayAPI.holidays({ country: locality, year, public: true });

    if (holidays.length === 0) return;

    await db.insert('holidays', holidays.map(holiday => (
      { name: holiday.name, 
        date: new Date(holiday.date), 
        observed: new Date(holiday.observed), 
        locality: holiday.country }
    ))).run(pool);

    return listHolidaysByCountry({ year, locality });
  };

  return {
    addHoliday,
    deleteHolidayById,
    deleteHolidaysByCountry,
    listHolidaysByCountry,
    listHolidaysByCountryForEntity,
    syncHolidays,
  };
};

export default service;
