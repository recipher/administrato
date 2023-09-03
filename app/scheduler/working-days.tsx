import { HolidayAPI } from 'holidayapi';

import getHolidays from './holidays.js';
import { nextDay, previousDay, parseISO, format } from './date.js';

const holidayAPI = new HolidayAPI({ key: process.env.HOLIDAY_API_KEY });

const ensureArray = array => Array.isArray(array) ? array : [ array ];

const WORKING_DAYS = {
  BH: [ 0, 1, 2, 3, 4 ],
  KW: [ 0, 1, 2, 3, 4 ],
  OM: [ 0, 1, 2, 3, 4 ],
  QA: [ 0, 1, 2, 3, 4 ],
  SA: [ 0, 1, 2, 3, 4 ],
  STANDARD: [ 1, 2, 3, 4, 5 ],
};

const compact = set => set.reduce((acc, next) => next === undefined ? acc : acc.concat([next]), []);

const getWorkingDays = countries => compact(countries)
  .map(country => WORKING_DAYS[country.toUpperCase()] || WORKING_DAYS.STANDARD)
  .reduce((a, b) => a.filter(c => b.includes(c)));

const isWorkingDay = (date, holidays, workingDays) => {
  const isHoliday = holidays.map(h => format(h)).includes(format(date));
  const isWorkDay = workingDays.includes(date.getUTCDay());

  return (isHoliday === false && isWorkDay === true);
};

const workingDayForCountries = async (findDay, compare, countries, start, days) => {
  let holidays = await getHolidays(countries, start);
  const workingDays = getWorkingDays(countries);

  if (days === 0 && isWorkingDay(start, holidays.map(h => h.date), workingDays))
    return { date: start, holidays };

  if (days === 0) days = 1;

  let date = findDay(start), next = date;

  if (compare(next.getUTCMonth(), start.getUTCMonth())) {
    const more = await getHolidays(countries, next);
    holidays = holidays.concat(more);
  }

  while (days > 0) {
    if (isWorkingDay(date, holidays.map(h => h.date), workingDays)) days--;

    if (days > 0) next = findDay(date);

    if (compare(next.getUTCMonth(), date.getUTCMonth())) {
      const more = await getHolidays(countries, next);
      holidays = holidays.concat(more);
    }

    date = next;
  };

  return { date, holidays };
};

const workingDay = async (wd, countries, start, days) => {
  return wd(ensureArray(countries), start, days);
  if (Array.isArray(countries)) return wd(countries, start, days);

  const [ country ] = ensureArray(countries);
  const response = await holidayAPI.workday({ country, start: format(start), days });

  return { date: parseISO(response.workday.date) };
};

const previousWorkingDayForCountries = async (countries, start, days = 1) =>
  workingDayForCountries(previousDay, (p, d) => p < d, countries, start, days * -1);

const nextWorkingDayForCountries = async (countries, start, days = 1) =>
  workingDayForCountries(nextDay, (n, d) => n > d, countries, start, days);

const previousWorkingDay = async (countries, start, days = 1) =>
  workingDay(previousWorkingDayForCountries, countries, start, days * -1);

const nextWorkingDay = async (countries, start, days = 1) =>
  workingDay(nextWorkingDayForCountries, countries, start, days);

export { previousWorkingDay, nextWorkingDay, getWorkingDays, isWorkingDay };