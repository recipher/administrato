import type * as s from 'zapatos/schema';
import * as db from 'zapatos/db';
import pool from '../db.server';

import { ASC } from '../types';
export { default as create } from '../id.server';

import HolidayService from './holidays.server';

import { type User } from '../access/users.server';
import { format, previousDay, nextDay } from './date';

const STANDARD = [ 1, 2, 3, 4, 5 ];

export type CountryData = { id: string, countries: Array<string>};

type HolidayProps = {
  countries: Array<CountryData>;
  month?: number;
  year: number;
};

type DetermineProps = {
  countries: Array<CountryData>;
  start: Date;
  days?: number | undefined;
};

export type WorkingDays = s.workingDays.Selectable & { locality: s.localities.Selectable };
export type Country = s.localities.Selectable;

const Service = (u: User) => {
  const saveWorkingDays = async (workingDays: s.workingDays.Insertable) => {
    if (workingDays.days === undefined) workingDays.days = STANDARD;
    return db.upsert('workingDays', workingDays, [ 'country' ]).run(pool);
  };

  const removeWorkingDays = async ({ country }: { country: string }) => {
    db.deletes('workingDays', { country }).run(pool);
  };

  const listWorkingDays = async () => {
    return db.select('workingDays', db.all, { 
      lateral: {
        locality: db.selectExactlyOne('localities', { isoCode: db.parent('country' )}) 
      },
      order: [ { by: 'country', direction: ASC }]
    }).run(pool);
  };

  const getWorkingDays = async (countries: Array<string>) => {
    const workingDays = await db.select('workingDays',
      { country: db.conditions.isIn(countries) },
      { columns: [ 'days' ] }
    ).run(pool);

    if (workingDays.length === 0) return STANDARD;

    const wds = workingDays.map(({ days }) => days);

    return [ ...Array(7).keys() ].reduce((wd: Array<number>, day: number) =>
      wds.reduce((include: boolean, wd: Array<number>) =>
        wd.includes(day) && include, true) ? [ ...wd, day ] : wd, []);
  };

  const isWorkingDay = (date: Date, holidays: Array<Date>, workingDays: Array<number>) => {
    const isHoliday = holidays.map(h => format(h)).includes(format(date));
    const isWorkDay = workingDays.includes(date.getUTCDay());
  
    return (isHoliday === false && isWorkDay === true);
  };

  const listHolidays = async ({ countries, month, year }: HolidayProps) => {
    const service = HolidayService(u);

    const holidays = await Promise.all(countries.map(async country => {
      const { id: entityId, countries } = country;
      const holidays = await Promise.all(countries.map(async locality => {
        return service.listHolidaysByCountryForEntity({ month, year, locality, entityId });
      }));
      return holidays.flat();
    }));
    return holidays.flat();
  };

  const determine = async ({ countries, start, days = 1 }: DetermineProps, { compare, find }: { compare: Function, find: Function }) => {
    const month = start.getUTCMonth() + 1, year = start.getUTCFullYear();
    
    const codes = countries.map(c => c.countries).flat();
    const workingDays = await getWorkingDays(codes);

    let holidays = await listHolidays({ countries, month, year });

    if (days === 0 && isWorkingDay(start, holidays.map(h => h.observed || h.date), workingDays)) 
      return { date: start, holidays };
    if (days === 0) days = 1;

    let date = find(start), next = date;

    if (compare(next.getUTCMonth(), start.getUTCMonth())) {
      holidays = await listHolidays({ countries, month: next.getUTCMonth()+1, year: next.getUTCFullYear() });
    }

    while (days > 0) {
      if (isWorkingDay(date, holidays.map(h => h.observed || h.date), workingDays)) days--;

      if (days > 0) next = find(date);

      if (compare(next.getUTCMonth(), date.getUTCMonth())) {
        holidays = await listHolidays({ countries, month: next.getUTCMonth()+1, year: next.getUTCFullYear() });
      }
      date = next;
    };

    return { date, holidays };
  };

  const determinePrevious = async (params: DetermineProps) =>
    determine(params, { compare: (p: number, d: number) => p < d, find: previousDay });

  const determineNext = async (params: DetermineProps) =>
    determine(params, { compare: (n: number, d: number) => n > d, find: nextDay });

  return { 
    determinePrevious, 
    determineNext, 
    saveWorkingDays, 
    removeWorkingDays,
    getWorkingDays,
    listHolidays,
    listWorkingDays 
  };
};

export default Service;
