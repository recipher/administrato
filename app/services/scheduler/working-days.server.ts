import type * as s from 'zapatos/schema';
import * as db from 'zapatos/db';
import pool from '../db.server';

import HolidayService from './holidays.server';

import { type User } from '../access/users.server';
import { format, previousDay, nextDay } from './date';

const WorkingDays = {
  bh: [ 0, 1, 2, 3, 4 ],
  kw: [ 0, 1, 2, 3, 4 ],
  om: [ 0, 1, 2, 3, 4 ],
  qa: [ 0, 1, 2, 3, 4 ],
  sa: [ 0, 1, 2, 3, 4 ],
  Standard: [ 1, 2, 3, 4, 5 ],
};

const compact = (set: Array<any>) => set.reduce((acc, next) => next === undefined ? acc : acc.concat([next]), []);

type CountryData = { id: string, countries: Array<string>};

type HolidayProps = {
  countries: Array<CountryData>;
  year: number;
};

type DetermineProps = {
  countries: Array<CountryData>;
  start: Date;
  days?: number | undefined;
};

const Service = (u: User) => {
  const getWorkingDays = (countries: Array<string>) => WorkingDays.Standard;
    // compact(countries)
    //   .map((country: string) => WorkingDays[country] || WorkingDays.Standard)
    //   .reduce((a: Array<Array<number>>, b: Array<number>) => a.filter(c => b.includes(c)));

  const isWorkingDay = (date: Date, holidays: Array<Date>, workingDays: Array<number>) => {
    const isHoliday = holidays.map(h => format(h)).includes(format(date));
    const isWorkDay = workingDays.includes(date.getUTCDay());
  
    return (isHoliday === false && isWorkDay === true);
  };

  const listHolidays = async ({ countries, year }: HolidayProps) => {
    const holidays = await Promise.all(countries.map(async country => {
      const holidayService = HolidayService(u);
      const { id: entityId, countries } = country;
      const holidays = await Promise.all(countries.map(async locality => {
        return holidayService.listHolidaysByCountryForEntity({ year, locality, entityId });
      }));
      return holidays.flat();
    }));
    return holidays.flat().map(h => h.observed || h.date);
  };

  const determine = async ({ countries, start, days = 1 }: DetermineProps, { compare, find }: { compare: Function, find: Function }) => {
    const year = start.getUTCFullYear();
    
    const workingDays = WorkingDays.Standard; // getWorkingDays(countries);

    let holidays = await listHolidays({ countries, year });

    if (days === 0 && isWorkingDay(start, holidays, workingDays)) return start;
    if (days === 0) days = 1;

    let date = find(start), next = date;

    if (compare(next.getUTCFullYear(), start.getUTCFullYear())) {
      holidays = await listHolidays({ countries, year: next.getUTCFullYear() });
    }

    while (days > 0) {
      if (isWorkingDay(date, holidays, workingDays)) days--;

      if (days > 0) next = find(date);

      if (compare(next.getUTCFullYear(), date.getUTCFullYear())) {
        holidays = await listHolidays({ countries, year: next.getUTCFullYear() });
      }

      date = next;
    };

    return date;
  };

  const determinePrevious = (params: DetermineProps) =>
    determine(params, { compare: (p: number, d: number) => p < d, find: previousDay });

  const determineNext = (params: DetermineProps) =>
    determine(params, { compare: (n: number, d: number) => n > d, find: nextDay });

  return { determinePrevious, determineNext };
};

export default Service;
