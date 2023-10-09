import type * as s from 'zapatos/schema';
import * as db from 'zapatos/db';
import pool from '../db.server';

import { format, getWeek, isAfter, differenceInCalendarWeeks, addWeeks, differenceInCalendarMonths, addMonths } from 'date-fns';
import { adjustForUTCOffset, startOfWeek, startOfMonth } from './date';

export { default as create } from '../id.server';

import { type User } from '../access/users.server';
import LegalEntityService, { LegalEntity } from '../manage/legal-entities.server';
import MilestoneService, { Milestone } from './milestones.server';

export { Target, Weekday, toTarget } from './target';
import TargetService from './target';

type GenerateProps = {
  legalEntityId: string;
  start: Date;
  end: Date;
};

export enum Frequency {
  Monthly = 'monthly',
  Weekly = 'weekly',
  BiWeekly = 'bi-weekly',
  FourWeekly = 'four-weekly',
  TriMonthly = 'tri-monthly',
  SemiMonthly = 'semi-monthly',
  Quarterly = 'quarterly',
  HalfYearly = 'half-yearly',
  Yearly = 'yearly',
};

const range = (start: number, stop: number, step = 1) => 
  Array.from({ length: (stop - start) / step + 1 }, (_, i) => start + (i * step));

const service = (u: User) => {

  const names = {
    week: (date: Date) => `Week ${getWeek(date)}`,
    month: (date: Date) => format(adjustForUTCOffset(date), 'LLLL'),
    year: (date: Date) => format(adjustForUTCOffset(date), 'yyyy'),
  };

  const nameFor = {
    [Frequency.Weekly]:      names.week,
    [Frequency.BiWeekly]:    names.week,
    [Frequency.Monthly]:     names.month,
    [Frequency.TriMonthly]:  names.month,
    [Frequency.SemiMonthly]: names.month,
    [Frequency.FourWeekly]:  names.week,
    [Frequency.Quarterly]:   names.month,
    [Frequency.HalfYearly]:  names.month, 
    [Frequency.Yearly]:      names.year,
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

  const weeks = (s: Date, e: Date) => differenceInCalendarWeeks(e, s, { weekStartsOn: 1 });
  const months = (s: Date, e: Date) => differenceInCalendarMonths(e, s);

  const datesFor = {
    [Frequency.Weekly]: (s: Date, e: Date) => range(0, weeks(s, e)).map(week => addWeeks(startOfWeek(s), week)),
    [Frequency.BiWeekly]: (s: Date, e: Date) => [],
    [Frequency.Monthly]: (s: Date, e: Date) => range(0, months(s, e)).map(month => addMonths(startOfMonth(s), month)),
    [Frequency.TriMonthly]: (s: Date, e: Date) => [],
    [Frequency.SemiMonthly]: (s: Date, e: Date) => [],
    [Frequency.FourWeekly]: (s: Date, e: Date) => [],
    [Frequency.Quarterly]: (s: Date, e: Date) => [],
    [Frequency.HalfYearly]: (s: Date, e: Date) => [],
    [Frequency.Yearly]: (s: Date, e: Date) => [],
  };

  type GeneratePeriodProps = { 
    legalEntity: LegalEntity;
    countries: Array<{ id: string, countries: Array<string>}>;
    start: Date;
    end: Date;
  };

  const generatePeriods = async ({ legalEntity, countries, start, end }: GeneratePeriodProps) => {
    const targetService = TargetService(u);

    const { frequency: f, target } = legalEntity;

    const frequency = f as Frequency;
    if (frequency === null) throw new Error('No schedule frequency specified');

    const dates = datesFor[frequency](start, end);

    return Promise.all(dates.map(async (date: Date) => {
      const targetDate = await targetService.determineTargetDate({ countries, date, frequency, target });
      return {
        targetDate,
        name: nameFor[frequency](date),
      }
    }));
  };

  const getTargetMilestoneForLegalEntity = async ({ legalEntity }: { legalEntity: LegalEntity }) => {
    const { milestoneSetId: setId } = legalEntity;

    const service = MilestoneService(u);
    const milestones = await service.listMilestonesBySetOrDefault({ setId });
    if (milestones.length === 0) throw new Error('No milestones found');
    return milestones.find(m => m.target === true) || milestones.at(0);
  };

  const getCountriesForMilestone = async ({ milestone, legalEntityId }: { milestone: Milestone, legalEntityId: string }) => {
    const service = MilestoneService(u);
    return service.getCountriesForMilestone({ milestone, legalEntityId });
  };

  const generate = async ({ legalEntityId, start, end }: GenerateProps) => {
    const service = LegalEntityService(u);
    const legalEntity = await service.getLegalEntity({ id: legalEntityId });
    
    const targetMilestone = await getTargetMilestoneForLegalEntity({ legalEntity });
    if (targetMilestone === undefined) throw new Error('No target milestone');
    const countries = await getCountriesForMilestone({ milestone: targetMilestone, legalEntityId });

    const dates = isAfter(start, end) ? { start: end, end: start } : { start, end };
    const periods = await generatePeriods({ legalEntity, countries, ...dates });

    console.log(JSON.stringify(periods, null, 2));
  };

  return {
    generate,
  }
};

export default service;