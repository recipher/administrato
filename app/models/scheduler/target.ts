import { endOfWeek as eow } from 'date-fns';
// import getHolidays from './holidays.js';
// import { previousWorkingDay, nextWorkingDay, getWorkingDays, isWorkingDay } from './working-days.js';
import { addDays } from './date';

import { Frequency } from './schedules.server';

const MID_MONTH = 15;

export enum Target {
  Last = 'last',
  Following = 'following',
  Day = 'day',
  Date = 'date',
};

export enum Weekday {
  Monday = 'monday',
  Tuesday = 'tuesday',
  Wednesday = 'wednesday',
  Thursday = 'thursday',
  Friday = 'friday',
  Saturday = 'saturday',
  Sunday = 'sunday',
};

type TargetProps = { 
  target: Array<string | Target>;
  day?: Array<string | Weekday | undefined>;
  date?: Array<number | undefined>;
  offset?: Array<number | undefined>; 
};

export const toTarget = ({ target, day, date, offset }: TargetProps) => {
  return target.map((t: string, i: number) => {
    const o = offset?.at(i), d = date?.at(i), y = day?.at(i);
    return {
      [Target.Last]:      `${t} ${o === null ? 0 : o}`,
      [Target.Following]: `${t} ${d === null ? 0 : d}`,
      [Target.Day]:       `${t} ${y === null ? Weekday.Friday : y}`,
      [Target.Date]:      `${t} ${d === null ? 31 : d}`,
    }[t];
  }).join(',');
};

const endOfMonth = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth()+1, 0));

const endOfHalfMonth = (d: Date) => {
  const day = d.getUTCDate();
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth()+1, 0));
  return (day === MID_MONTH) ? date : new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - 14));
};

const endOfWeek = (d: Date) => {
  const end = eow(d);
  return new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
};

const endOf = {
  [Frequency.Monthly]: (d: Date) => endOfMonth(d),
  [Frequency.Weekly]: (d: Date) => endOfWeek(d),
  [Frequency.BiWeekly]: (d: Date) => endOfWeek(d),
  [Frequency.FourWeekly]: (d: Date) => endOfWeek(d),
  [Frequency.TriMonthly]: (d: Date) => endOfMonth(d),
  [Frequency.SemiMonthly]: (d: Date) => endOfHalfMonth(d),
  [Frequency.Quarterly]: (d: Date) => endOfMonth(d),
  [Frequency.HalfYearly]: (d: Date) => endOfMonth(d),
  [Frequency.Yearly]: (d: Date) => endOfMonth(d),
};

const previousDay = (date: Date, day: number) => {
  let delta = day - date.getUTCDay();
  if (delta > 0) delta -= 7;
  return addDays(date, delta);
};

const lastDayOf = (frequency: Frequency, date: Date) => {
  const end = endOf[frequency](date);
  return {
    [Weekday.Sunday]: () => previousDay(end, 0),
    [Weekday.Monday]: () => previousDay(end, 1),
    [Weekday.Tuesday]: () => previousDay(end, 2),
    [Weekday.Wednesday]: () => previousDay(end, 3),
    [Weekday.Thursday]: () => previousDay(end, 4),
    [Weekday.Friday]: () => previousDay(end, 5),
    [Weekday.Saturday]: () => previousDay(end, 6),
  };
};

const setDate = (date: Date, d: number, m?: number) => {
  const copy = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  copy.setUTCDate(d);
  if (m) copy.setUTCMonth(m);
  return copy;
};

// const getDueUsingSuggestion = async (wd, country, suggestion, days) => {
//   const holidays = await getHolidays([ country ], suggestion);
//   const workingDays = getWorkingDays([ country ]);
//   const isWorkDay = isWorkingDay(suggestion, holidays.map(h => h.date), workingDays);

//   if (days === undefined) {
//     return isWorkDay ? { date: suggestion } : wd(country, suggestion);
//   }

//   if (!isWorkDay) { 
//     suggestion = (await previousWorkingDay([ country ], suggestion)).date;
//   } 
//   return wd(country, suggestion, days);
// };

// const getDue = (country, period, date) => {
//   return {
//     [Whens.last]: async d => getDueUsingSuggestion(previousWorkingDay, country, endOf[period](date), d),
//     [Whens.day]: async d => getDueUsingSuggestion(previousWorkingDay, country, lastDayOf(period, date)[d]()),

//     [Whens.date]: async d => {
//       const due = setDate(date, d);
//       const suggestion = due.getUTCMonth() === date.getUTCMonth() ? due : endOf[period](date);

//       return getDueUsingSuggestion(previousWorkingDay, country, suggestion);
//     },

//     [Whens.following]: async d => getDueUsingSuggestion(previousWorkingDay, country, setDate(date, d, date.getUTCMonth()+1)),
//   };
// };

// const due = async (country, date, period, when, day) => {
//   const due = await getDue(country, period, date)[when](day);
//   return due.date;
// };

// export default due;

