import { endOfWeek as eow, addMonths, addWeeks, addYears } from 'date-fns';
import { addDays, setDate } from './date';

import { Frequency } from './schedules.server';
import WorkingDayService from './working-days.server';

import { type User } from '../access/users.server';

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
  target: string | Target;
  day?: string | Weekday | undefined;
  date?: number | undefined;
  offset?: number | undefined; 
};
type TargetsProps = Array<TargetProps>;

export const toTarget = (targets: TargetsProps) => {
  return targets.map(({ target: t, offset: o, day: y, date: d }: TargetProps) => {
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

const followingMonth = (d: Date, n: number = 1) => addMonths(d, n);
const followingWeek = (d: Date, n: number = 1) => addWeeks(d, n);
const followingYear = (d: Date) => addYears(d, 1);

const followingOf = {
  [Frequency.Monthly]: (d: Date) => followingMonth(d),
  [Frequency.Weekly]: (d: Date) => followingWeek(d),
  [Frequency.BiWeekly]: (d: Date) => followingWeek(d, 2),
  [Frequency.FourWeekly]: (d: Date) => followingWeek(d, 4),
  [Frequency.TriMonthly]: (d: Date) => followingMonth(d),
  [Frequency.SemiMonthly]: (d: Date) => followingMonth(d),
  [Frequency.Quarterly]: (d: Date) => followingMonth(d, 3),
  [Frequency.HalfYearly]: (d: Date) => followingMonth(d, 6),
  [Frequency.Yearly]: (d: Date) => followingYear(d),
};

const previousDay = (date: Date, day: number) => {
  let delta = day - date.getUTCDay();
  if (delta > 0) delta -= 7;
  return addDays(date, delta);
};

const lastDayOf = (frequency: Frequency, date: Date) => {
  const end = endOf[frequency](date);
  return {
    [Weekday.Sunday]: previousDay(end, 0),
    [Weekday.Monday]: previousDay(end, 1),
    [Weekday.Tuesday]: previousDay(end, 2),
    [Weekday.Wednesday]: previousDay(end, 3),
    [Weekday.Thursday]: previousDay(end, 4),
    [Weekday.Friday]: previousDay(end, 5),
    [Weekday.Saturday]: previousDay(end, 6),
  };
};

type Props = { 
  countries: Array<{ id: string, countries: Array<string>}>;
  date: Date;
  frequency: Frequency;
  target: string | null;
};

const Service = (u: User) => {
  const determineTargetDate = async ({ countries, date, frequency, target }: Props) => {
    const workingDayService = WorkingDayService(u);

    if (target === null) target = "";

    return Promise.all(target.split(",").map(async (t: string) => {
      const [ target, data ] = t.split(' ');
    
      const suggestion = {
        [Target.Last]: () => endOf[frequency](date),
        [Target.Date]: () => {
          const suggestion = setDate(date, parseInt(data));
          return suggestion.getUTCMonth() === suggestion.getUTCMonth() 
            ? suggestion 
            : endOf[frequency](date);
        },
        [Target.Day]: () => lastDayOf(frequency, date)[data as Weekday],
        [Target.Following]: () => followingOf[frequency](date),
      }[target];

      if (suggestion === undefined) throw new Error("Invalid target data");

      const days = parseInt(data);
      return workingDayService.determinePrevious({ countries, start: suggestion(), days: isNaN(days) ? undefined : days })
    }));
  };

  return { determineTargetDate };
};

export default Service;

