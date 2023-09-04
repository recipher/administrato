import { HolidayAPI } from 'holidayapi';
import type * as s from 'zapatos/schema';
import * as db from 'zapatos/db';
import pool from './db.server';

const key = process.env.HOLIDAY_API_KEY as string;
const holidayAPI = new HolidayAPI({ key });

export type Holiday = s.localities.Selectable;

const addHoliday = async (holiday: s.localities.Insertable) => {
  // return db.insert('holidays',
  //   { name: holiday.name, 
  //     date: new Date(holiday.date), 
  //     observed: new Date(holiday.observed), 
  //     locality: holiday.country }
  // ).run(pool);
};

type SearchProps = { 
  year: number;
  locality: string 
};

type OptionProps = { 
  shouldDelete?: boolean;
};

export const deleteHolidayById = async (id: number) => {
  return db.sql<s.holidays.SQL>`
    DELETE FROM ${'holidays'} WHERE ${{id}}`
    .run(pool);
};

export const deleteHolidaysByCountry = async ({ year, locality }: SearchProps) => {
  return db.sql<s.holidays.SQL>`
    DELETE FROM ${'holidays'} 
    WHERE 
      ${{locality}} AND 
      ${'entityId'} IS NULL AND 
      DATE_PART('year', ${'date'}) = ${db.param(year)}`
    .run(pool);
};

export const listHolidaysByCountry = async ({ year, locality }: SearchProps) => {
  return db.sql<s.holidays.SQL, s.holidays.Selectable[]>`
    SELECT * FROM ${'holidays'} 
    WHERE 
      ${{locality}} AND 
      ${'entityId'} IS NULL AND 
      DATE_PART('year', ${'date'}) = ${db.param(year)}
    ORDER BY ${'date'} ASC`.run(pool);
};

export const syncHolidays = async ({ year, locality }: SearchProps, { shouldDelete = false }: OptionProps = {}) => {
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