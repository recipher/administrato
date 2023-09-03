import { endOfWeek as eow } from 'date-fns';
import getHolidays from './holidays.js';
import { previousWorkingDay, nextWorkingDay, getWorkingDays, isWorkingDay } from './working-days.js';
import { addDays } from './date.js';
import Periods from './periods.js';

const Whens = {
  last: 'last',
  following: 'following',
  day: 'day',
  date: 'date',
};

const Weekdays = {
  Monday: 'Monday',
  Tuesday: 'Tuesday',
  Wednesday: 'Wednesday',
  Thursday: 'Thursday',
  Friday: 'Friday',
  Saturday: 'Saturday',
  Sunday: 'Sunday',
};

const endOfMonth = d => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth()+1, 0));

const endOfHalfMonth = d => {
  const day = d.getUTCDate();
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth()+1, 0));
  return (day === 15) ? date : new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - 14));
};

const endOfWeek = d => {
  const end = eow(d);
  return new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
};

const endOf = {
  [Periods.monthly]: d => endOfMonth(d),
  [Periods.weekly]: d => endOfWeek(d),
  [Periods.biWeekly]: d => endOfWeek(d),
  [Periods.fourWeekly]: d => endOfWeek(d),
  [Periods.semiMonthly]: d => endOfHalfMonth(d),
  [Periods.quarterly]: d => endOfMonth(d),
  [Periods.halfYearly]: d => endOfMonth(d),
  [Periods.yearly]: d => endOfMonth(d),
};

const previousDay = (date, day) => {
  let delta = day - date.getUTCDay();
  if (delta > 0) delta -= 7;
  return addDays(date, delta);
};

const lastDayOf = (period, date) => {
  const end = endOf[period](date);
  return {
    [Weekdays.Sunday]: _ => previousDay(end, 0),
    [Weekdays.Monday]: _ => previousDay(end, 1),
    [Weekdays.Tuesday]: _ => previousDay(end, 2),
    [Weekdays.Wednesday]: _ => previousDay(end, 3),
    [Weekdays.Thursday]: _ => previousDay(end, 4),
    [Weekdays.Friday]: _ => previousDay(end, 5),
    [Weekdays.Saturday]: _ => previousDay(end, 6),
  };
};

const setDate = (date, d, m) => {
  const copy = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  copy.setUTCDate(d);
  if (m) copy.setUTCMonth(m);
  return copy;
};

const getDueUsingSuggestion = async (wd, country, suggestion, days) => {
  const holidays = await getHolidays([ country ], suggestion);
  const workingDays = getWorkingDays([ country ]);
  const isWorkDay = isWorkingDay(suggestion, holidays.map(h => h.date), workingDays);

  if (days === undefined) {
    return isWorkDay ? { date: suggestion } : wd(country, suggestion);
  }

  if (!isWorkDay) { 
    suggestion = (await previousWorkingDay([ country ], suggestion)).date;
  } 
  return wd(country, suggestion, days);
};

const getDue = (country, period, date) => {
  return {
    [Whens.last]: async d => getDueUsingSuggestion(previousWorkingDay, country, endOf[period](date), d),
    [Whens.day]: async d => getDueUsingSuggestion(previousWorkingDay, country, lastDayOf(period, date)[d]()),

    [Whens.date]: async d => {
      const due = setDate(date, d);
      const suggestion = due.getUTCMonth() === date.getUTCMonth() ? due : endOf[period](date);

      return getDueUsingSuggestion(previousWorkingDay, country, suggestion);
    },

    [Whens.following]: async d => getDueUsingSuggestion(previousWorkingDay, country, setDate(date, d, date.getUTCMonth()+1)),
  };
};

const due = async (country, date, period, when, day) => {
  const due = await getDue(country, period, date)[when](day);
  return due.date;
};

export { Whens, Weekdays, endOf, lastDayOf, setDate };

export default due;

