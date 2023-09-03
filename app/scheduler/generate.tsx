import Promise from 'bluebird';
import * as R from 'ramda';
import { format, addWeeks, getWeek, nextMonday } from 'date-fns';
import { adjustForUTCOffset } from './date.js';
import Periods, { TaxYears } from './periods.js';
import determineDue from './due.js';
import { previousWorkingDay, nextWorkingDay } from './working-days.js';

const range = (start, stop, step = 1) => 
  Array.from({ length: (stop - start) / step + 1 }, (_, i) => start + (i * step));

const byIndexDesc = (l, r) => l.index - r.index;
const byIndexAsc = (l, r) => r.index - l.index;

export const PAY_DAY = 'employee pay day';
export const isDueDate = ms => R.startsWith(PAY_DAY, ms.title.toLowerCase());
export const findDueDate = ms => R.find(isDueDate, ms) || ms[ms.length-1];

const weeks = (ty = TaxYears.JanToDec) =>
  ({
    [TaxYears.JanToDec]: 51,
    [TaxYears.MarToFeb]: 60,
    [TaxYears.AprToMar]: 64,
    [TaxYears.AprToApr]: 65,
    [TaxYears.JulToJun]: 77,    
    [TaxYears.OctToSept]: 90,
  }[ty]);

const months = (ty = TaxYears.JanToDec) =>
  ({
    [TaxYears.JanToDec]: 11,
    [TaxYears.MarToFeb]: 13,
    [TaxYears.AprToMar]: 14,
    [TaxYears.AprToApr]: 14,
    [TaxYears.JulToJun]: 17,
    [TaxYears.OctToSept]: 20,
  }[ty]);

const PE_TO_OFFSET = {
  '2': { from: '2024-01-15', to: '2023-01-21' },
  '1': { from: '2024-01-08', to: '2023-01-14' },
  '0': { from: '2024-01-01', to: '2023-01-07' },
 '-1': { from: '2023-12-25', to: '2023-12-31' },
 '-2': { from: '2023-12-18', to: '2023-12-24' },
};

const sp = (pe, multiplier, offset) =>
  (parseInt(Object.keys(PE_TO_OFFSET)
    .reduce((acc, value) => new Date(PE_TO_OFFSET[value].from) <= new Date(pe) && 
                            new Date(PE_TO_OFFSET[value].to) >= new Date(pe) ? value : acc)) * multiplier) + offset;

const datesFor = {
  [Periods.weekly]: (y, ty, pe) => range(sp(pe, 1, 1), weeks(ty)).map(week => addWeeks(new Date(Date.UTC(y, 0, 2)), week)), 
  [Periods.biWeekly]: (y, ty, pe) => range(sp(pe, 2, 3), weeks(ty), 2).map(week => addWeeks(new Date(Date.UTC(y, 0, 2)), week)),
  [Periods.monthly]: (y, ty) => range(0, months(ty)).map(month => new Date(Date.UTC(y, month, 1))),
  [Periods.semiMonthly]: (y, ty) => range(0, months(ty)).map(month => [ new Date(Date.UTC(y, month, 1)), new Date(Date.UTC(y, month, 15)) ]).flat(),
  [Periods.fourWeekly]: (y, ty, pe) => range(sp(pe, 4, 6), weeks(ty)).map(week => addWeeks(new Date(Date.UTC(y, 0, 2)), week)),
  [Periods.quarterly]: (y, ty) => range(3, months(ty), 3).map(month => new Date(Date.UTC(y, month, 1))),
  [Periods.halfYearly]: (y, ty) => range(5, months(ty), 6).map(month => new Date(Date.UTC(y, month, 1))),
  [Periods.yearly]: (y, ty) => range(months(ty)).map(month => new Date(Date.UTC(y, month, 1))),
};

const titles = {
  week: date => `Week ${getWeek(date)}`,
  month: date => format(adjustForUTCOffset(date), 'LLLL'),
  year: date => format(adjustForUTCOffset(date), 'yyyy'),
};

const titleFor = {
  [Periods.weekly]:      titles.week,
  [Periods.biWeekly]:    titles.week,
  [Periods.monthly]:     titles.month,
  [Periods.semiMonthly]: titles.month,
  [Periods.fourWeekly]:  titles.week,
  [Periods.quarterly]:   titles.month,
  [Periods.halfYearly]:  titles.month, 
  [Periods.yearly]:      titles.year,
};

const generatePeriods = async (year, { country, period, taxYear, due, periodEnd }) => {
  return Promise.map(datesFor[period](year, taxYear, periodEnd), async (date, index) => {
    const { when, day } = Array.isArray(due) ? due.find(d => d.index === index % 2) : due;
    return {
      dueDate: await determineDue(country, date, period, when, day),
      period: titleFor[period](date),
    }
  });
};

const uniq = items => items.reduce((items, item) => items.includes(item) ? items : items.concat([ item ]), []);

const generate = async (year, entity) => {
  const countries = uniq(entity.countries.concat([ entity.country ]));
  const periods = await generatePeriods(year, entity);

  const schedule = await Promise.map(periods, async period => {
    const due = findDueDate(entity.milestones) || entity.milestones.sort(byIndexDesc)[0];

    // Calculate milestone dates before due date
    const findBefore = ms => R.filter(m => m.index >= due.index, ms).sort(byIndexDesc);
    let previous = { date: period.dueDate, holidays: [] };

    const before = await Promise.mapSeries(findBefore(entity.milestones), async milestone => {
      const ms = { ...milestone, due: previous.date };

      if (milestone.days !== undefined && !Number.isNaN(milestone.days)) {
        previous = await previousWorkingDay(countries, previous.date, milestone.days);
      }

      return { ms, holidays: previous.holidays };
    });

    // Calculate milestone dates after due date
    let next = { date: period.dueDate, holidays: [] };
    const findAfter = ms => R.filter(m => m.index < due.index, ms).sort(byIndexAsc);

    const after = await Promise.mapSeries(findAfter(entity.milestones), async milestone => {
      next = await nextWorkingDay(countries, next.date, milestone.days);
      const ms = { ...milestone, due: next.date };

      return { ms, holidays: next.holidays };
    });

    const data = [ ...before, ...after ].sort(byIndexDesc);

    return { period: period.period, dates: data.map(d => d.ms), holidays: data.map(d => d.holidays).flat() };
  });

  return { schedule, holidays: schedule.map(s => s.holidays).flat(), info: { ...entity, countries: uniq(entity.countries) }};
};

export { range, datesFor, titleFor, generatePeriods };

export default generate;