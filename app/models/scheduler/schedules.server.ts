import type * as s from 'zapatos/schema';
import * as db from 'zapatos/db';
import pool from '../db.server';

import { format, addWeeks, getWeek } from 'date-fns';
import { adjustForUTCOffset } from './date';

export { default as create } from '../id.server';

import { type User } from '../access/users.server';
import LegalEntityService, { LegalEntity, Frequency } from '../manage/legal-entities.server';


type GenerateProps = {
  legalEntityId: string;
  start: Date;
  end: Date;
};


const range = (start: number, stop: number, step = 1) => 
  Array.from({ length: (stop - start) / step + 1 }, (_, i) => start + (i * step));


const service = (u: User) => {

  const titles = {
    week: (date: Date) => `Week ${getWeek(date)}`,
    month: (date: Date) => format(adjustForUTCOffset(date), 'LLLL'),
    year: (date: Date) => format(adjustForUTCOffset(date), 'yyyy'),
  };

  // const datesFor = {
  //   [Frequency.Weekly]: (y, ty, pe) => range(sp(pe, 1, 1), weeks(ty)).map(week => addWeeks(new Date(Date.UTC(y, 0, 2)), week)), 
  //   [Frequency.BiWeekly]: (y, ty, pe) => range(sp(pe, 2, 3), weeks(ty), 2).map(week => addWeeks(new Date(Date.UTC(y, 0, 2)), week)),
  //   [Frequency.Monthly]: (y, ty) => range(0, months(ty)).map(month => new Date(Date.UTC(y, month, 1))),
  //   [Frequency.SemiMonthly]: (y, ty) => range(0, months(ty)).map(month => [ new Date(Date.UTC(y, month, 1)), new Date(Date.UTC(y, month, 15)) ]).flat(),
  //   [Frequency.FourWeekly]: (y, ty, pe) => range(sp(pe, 4, 6), weeks(ty)).map(week => addWeeks(new Date(Date.UTC(y, 0, 2)), week)),
  //   [Frequency.Quarterly]: (y, ty) => range(3, months(ty), 3).map(month => new Date(Date.UTC(y, month, 1))),
  //   [Frequency.HalfYearly]: (y, ty) => range(5, months(ty), 6).map(month => new Date(Date.UTC(y, month, 1))),
  //   [Frequency.Yearly]: (y, ty) => range(months(ty)).map(month => new Date(Date.UTC(y, month, 1))),
  // };

  const datesFor = {
    // [Frequency.Weekly]: (s, e) => range(sp(pe, 1, 1), weeks(ty)).map(week => addWeeks(new Date(Date.UTC(y, 0, 2)), week)), 
    // [Frequency.BiWeekly]: (s, e) => range(sp(pe, 2, 3), weeks(ty), 2).map(week => addWeeks(new Date(Date.UTC(y, 0, 2)), week)),
    // [Frequency.TriWeekly]: (s, e) => range(sp(pe, 2, 3), weeks(ty), 2).map(week => addWeeks(new Date(Date.UTC(y, 0, 2)), week)),
    // [Frequency.Monthly]: (s, e) => range(0, months(ty)).map(month => new Date(Date.UTC(y, month, 1))),
    // [Frequency.SemiMonthly]: (s, e) => range(0, months(ty)).map(month => [ new Date(Date.UTC(y, month, 1)), new Date(Date.UTC(y, month, 15)) ]).flat(),
    // [Frequency.FourWeekly]: (s, e) => range(sp(pe, 4, 6), weeks(ty)).map(week => addWeeks(new Date(Date.UTC(y, 0, 2)), week)),
    // [Frequency.Quarterly]: (s, e) => range(3, months(ty), 3).map(month => new Date(Date.UTC(y, month, 1))),
    // [Frequency.HalfYearly]: (s, e) => range(5, months(ty), 6).map(month => new Date(Date.UTC(y, month, 1))),
    // [Frequency.Yearly]: (s, e) => range(months(ty)).map(month => new Date(Date.UTC(y, month, 1))),
  };

  const generatePeriods = ({ legalEntity }: { legalEntity: LegalEntity, start: Date, end: Date }) => {
    const { frequency, targetDay: due } = legalEntity;
    // const dates = datesFor[frequency](start, end);

    // return Promise.all(datesFor[period](year, taxYear, periodEnd), async (date, index) => {
    //   const { when, day } = Array.isArray(due) ? due.find(d => d.index === index % 2) : due;
    //   return {
    //     dueDate: await determineDue(country, date, period, when, day),
    //     period: titleFor[period](date),
    //   }
    // });
  };

  const generate = async ({ legalEntityId, start, end }: GenerateProps) => {
    const service = LegalEntityService(u);

    const legalEntity = await service.getLegalEntity({ id: legalEntityId });

    const periods = await generatePeriods({ legalEntity, start, end });
  };

  return {
    generate,
  }
};

export default service;