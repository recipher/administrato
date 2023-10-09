import HolidayService from './holidays.server';

import { type User } from '../access/users.server';
import { format, previousDay, nextDay } from './date';

// import { nextDay, previousDay, parseISO, format } from './date.js';

const WorkingDays = {
  bh: [ 0, 1, 2, 3, 4 ],
  kw: [ 0, 1, 2, 3, 4 ],
  om: [ 0, 1, 2, 3, 4 ],
  qa: [ 0, 1, 2, 3, 4 ],
  sa: [ 0, 1, 2, 3, 4 ],
  Standard: [ 1, 2, 3, 4, 5 ],
};

const compact = (set: Array<any>) => set.reduce((acc, next) => next === undefined ? acc : acc.concat([next]), []);

// const workingDayForCountries = async (findDay, compare, countries, start, days) => {
//   let holidays = await getHolidays(countries, start);
//   const workingDays = getWorkingDays(countries);

//   if (days === 0 && isWorkingDay(start, holidays.map(h => h.date), workingDays))
//     return { date: start, holidays };

//   if (days === 0) days = 1;

//   let date = findDay(start), next = date;

//   if (compare(next.getUTCMonth(), start.getUTCMonth())) {
//     const more = await getHolidays(countries, next);
//     holidays = holidays.concat(more);
//   }

//   while (days > 0) {
//     if (isWorkingDay(date, holidays.map(h => h.date), workingDays)) days--;

//     if (days > 0) next = findDay(date);

//     if (compare(next.getUTCMonth(), date.getUTCMonth())) {
//       const more = await getHolidays(countries, next);
//       holidays = holidays.concat(more);
//     }

//     date = next;
//   };

//   return { date, holidays };
// };

// const workingDay = async (wd, countries, start, days) => {
//   return wd(ensureArray(countries), start, days);
//   if (Array.isArray(countries)) return wd(countries, start, days);

//   const [ country ] = ensureArray(countries);
//   const response = await holidayAPI.workday({ country, start: format(start), days });

//   return { date: parseISO(response.workday.date) };
// };

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

const service = (u: User) => {
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

  const determinePrevious = async ({ countries, start, days = 1 }: DetermineProps) => {
    const compare = (p: number, d: number) => p < d;

    const year = start.getUTCFullYear();
    
    const workingDays = WorkingDays.Standard; // getWorkingDays(countries);

    let holidays = await listHolidays({ countries, year });

    if (days === 0 && isWorkingDay(start, holidays, workingDays)) return start;

    if (days === 0) days = 1;

    let date = previousDay(start), next = date;

    if (compare(next.getUTCFullYear(), start.getUTCFullYear())) {
      holidays = await listHolidays({ countries, year: next.getUTCFullYear() });
    }

    while (days > 0) {
      if (isWorkingDay(date, holidays, workingDays)) days--;

      if (days > 0) next = previousDay(date);

      if (compare(next.getUTCFullYear(), date.getUTCFullYear())) {
        holidays = await listHolidays({ countries, year: next.getUTCFullYear() });
      }

      date = next;
    };

    return date;
  };

  return { determinePrevious };
};

export default service;
