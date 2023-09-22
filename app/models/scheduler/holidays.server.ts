import { HolidayAPI } from 'holidayapi';
import type * as s from 'zapatos/schema';
import * as db from 'zapatos/db';
import pool from '../db.server';

import { isSameDay, isSameMonth, isSameYear } from 'date-fns';

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

type OptionalEntityOptions = {
  entity: string | null;
  entityId: number | null;
};

type QueryOptions = { 
  shouldDelete?: boolean;
};

const isSameDate = (left: Date, right: Date) =>
  isSameDay(left, right) && isSameMonth(left, right) && isSameYear(left, right);
 
const service = () => {
  const addHoliday = async (holiday: s.holidays.Insertable) => {
    const [inserted] = await db.sql<s.holidays.SQL, s.holidays.Selectable[]>`
      INSERT INTO ${'holidays'} (${db.cols(holiday)})
      VALUES (${db.vals(holiday)}) RETURNING *`.run(pool);

    return inserted;
  };

  const getHolidayById = async ({ id }: { id: number }) => {
    const [ holiday ] = await db.sql<s.holidays.SQL, s.holidays.Selectable[]>`
      SELECT * FROM ${'holidays'} 
      WHERE ${{id}}`.run(pool);
    return holiday;
  };

  const deleteHolidayById = async (id: number, entity?: OptionalEntityOptions) => {
    if (entity) {
      const { name, date, locality, ...holiday } = await getHolidayById({ id });

      if (!holiday.entity) {
        return addHoliday({ name, date, locality, isRemoved: true, ...entity });
      }
    }
    return db.sql<s.holidays.SQL>`DELETE FROM ${'holidays'} WHERE ${{id}}`.run(pool);
  };

  const reinstateHolidayById = async (id: number, entity: EntityOptions) => {
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
    reinstateHolidayById,
    deleteHolidaysByCountry,
    getHolidayById,
    listHolidaysByCountry,
    listHolidaysByCountryForEntity,
    syncHolidays,
  };
};

export default service;
