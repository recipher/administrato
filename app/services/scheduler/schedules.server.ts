import type * as s from 'zapatos/schema';
import * as db from 'zapatos/db';
import pool from '../db.server';
import arc from '@architect/functions';

import { mapSeries } from 'bluebird';

import { format, getWeek, isAfter, differenceInCalendarWeeks, addWeeks, differenceInCalendarMonths, addMonths } from 'date-fns';
import { adjustForUTCOffset, startOfWeek, startOfMonth, setDate, isSameDate } from './date';

import { default as create } from '../id.server';

import { IdProp, TxOrPool, ASC, DESC } from '../types';

import { type User } from '../access/users.server';
import LegalEntityService, { LegalEntity } from '../manage/legal-entities.server';
import MilestoneService, { Milestone } from './milestones.server';

import WorkingDayService from './working-days.server';
import HolidaysService from './holidays.server';
import ApprovalsService, { type Approver, type Approval } from './approvals.server';

export { Target, Weekday, toTarget } from './target.server';
import TargetService, { Target } from './target.server';
import { type Holiday } from './holidays.server';

export type Schedule = s.schedules.Selectable;
export type ScheduleDate = s.scheduleDates.Selectable;
export type ScheduleWithDates = Schedule & { scheduleDates: Array<ScheduleDate>, approvals: Array<Approval> };

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

import { Status } from './approvals.server';
export { Status } from './approvals.server';

const DEFAULT = '-';

export type Schedulable = {
  keyStart: number;
  keyEnd: number;
  type: string;
};

const Service = (u: User) => {
  const getScheduleById = async ({ id }: IdProp, txOrPool: TxOrPool = pool) => {
    return db.selectExactlyOne('schedules', { id }).run(txOrPool);
  };

  const getSchedules = async ({ ids, status = Status.Draft }: { ids: Array<string> | undefined, status?: Status }, txOrPool: TxOrPool = pool) => {
    if (ids === undefined) return [];
    
    const schedules = await db.sql<s.schedules.SQL | s.approvals.SQL, Array<ScheduleWithDates>>`
      SELECT ${'schedules'}.*, ${'approvals'}.*
      FROM ${'schedules'} 
      LEFT JOIN LATERAL (
        SELECT COALESCE(JSON_AGG(${'approvals'}.*), '[]') AS ${'approvals'}
        FROM ${'approvals'}
        WHERE ${'schedules'}.${'id'} = ANY(${'approvals'}.${"entityId"}) AND 
          ${'approvals'}.${'userId'} = ${db.param(u.id)} AND 
          ${'approvals'}.${'status'} = ${db.param(status)}
      ) ${'approvals'} ON TRUE
      WHERE 
        ${{ id: db.conditions.isIn(ids) }}
      ORDER BY ${'schedules'}.${'date'} ASC
    `.run(txOrPool);

    return schedules.filter(schedule => schedule.approvals.length > 0);
  };

  const getScheduleByIdentity = async ({ id }: IdProp, txOrPool: TxOrPool = pool) => {
    const { legalEntityId, name, date } = await getScheduleById({ id }, txOrPool);
    return db.selectExactlyOne('schedules', { legalEntityId, name, date }, 
      { order: [ { by: 'version', direction: DESC } ], limit: 1 }).run(txOrPool);
  };
  
  const deleteSchedule = async ({ id }: IdProp, txOrPool: TxOrPool = pool) => {
    return db.deletes('schedules', { id }).run(txOrPool);
  };

  const changeDate = async ({ scheduleId, milestoneId, date }: { scheduleId: string, milestoneId: string, date: Date }, txOrPool: TxOrPool = pool) => {
    const [ update ] = await db.update('scheduleDates', 
      { date, isManual: true, updatedBy: u }, { scheduleId, milestoneId }).run(txOrPool);

    return update;
  };

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

  const weeks = (s: Date, e: Date) => differenceInCalendarWeeks(e, s, { weekStartsOn: 1 });
  const months = (s: Date, e: Date) => differenceInCalendarMonths(e, s);

  const datesFor = {
    [Frequency.Weekly]: (s: Date, e: Date) => 
      range(0, weeks(s, e)).map(week => addWeeks(startOfWeek(s), week)),
    [Frequency.BiWeekly]: (s: Date, e: Date) => 
      range(0, weeks(s, e), 2).map(week => addWeeks(startOfWeek(s), week)),
    [Frequency.Monthly]: (s: Date, e: Date) => 
      range(0, months(s, e)).map(month => addMonths(startOfMonth(s), month)),
    [Frequency.SemiMonthly]: (s: Date, e: Date) => 
      range(0, months(s, e)).map(month => 
        [ addMonths(startOfMonth(s), month), 
          setDate(addMonths(startOfMonth(s), month), 15) ]).flat(),
    [Frequency.TriMonthly]: (s: Date, e: Date) => 
      range(0, months(s, e)).map(month => 
        [ addMonths(startOfMonth(s), month), 
          setDate(addMonths(startOfMonth(s), month), 10), 
          setDate(addMonths(startOfMonth(s), month), 20) ]).flat(),
    [Frequency.FourWeekly]: (s: Date, e: Date) => 
      range(0, weeks(s, e), 4).map(week => addWeeks(startOfWeek(s), week)),
    [Frequency.Quarterly]: (s: Date, e: Date) => 
      range(3, months(s, e), 3).map(month => addMonths(startOfMonth(s), month)),
    [Frequency.HalfYearly]: (s: Date, e: Date) => 
      range(5, months(s, e), 6).map(month => addMonths(startOfMonth(s), month)),
    [Frequency.Yearly]: (s: Date, e: Date) => 
      range(11, months(s, e)).map(month => addMonths(startOfMonth(s), month)),
  };

  type Period = {
    date: Date;
    targetDate: Date;
    name: string;
  };

  type GeneratedScheduleDate = {
    id: string;
    date?: Date;
    index: number;
    target: boolean | null;
  };

  type GSD = GeneratedScheduleDate;

  type GeneratedSchedule = {
    period: Period;
    dates: Array<GeneratedScheduleDate>;
    holidays: Array<Holiday>;
  };

  type GeneratePeriodProps = { 
    legalEntity: LegalEntity;
    countries: Array<{ id: string, countries: Array<string>}>;
    start: Date;
    end: Date;
  };

  const range = (start: number, stop: number, step = 1) => 
    Array.from({ length: (stop - start) / step + 1 }, (_, i) => start + (i * step));

  const byIndexAsc = (l: GSD, r: GSD) => l.index - r.index;
  const byIndexDesc = (l: GSD, r: GSD) => r.index - l.index;

  const getCountriesForMilestone = async ({ milestone, legalEntityId }: { milestone: Milestone, legalEntityId: string }, txOrPool: TxOrPool = pool) => {
    const service = MilestoneService(u);
    return service.getCountriesForMilestone({ milestone, legalEntityId }, txOrPool);
  };

  const determinePeriods = async ({ legalEntity, countries, start, end }: GeneratePeriodProps) => {
    const targetService = TargetService(u);

    const { frequency: f, target } = legalEntity;

    const frequency = f as Frequency;
    if (frequency === null) throw new Error('No schedule frequency specified');

    const dates = datesFor[frequency](start, end);
    const targets = (target || Target.Last).split(',');

    return Promise.all(dates.map(async (date: Date, index: number) => {
      const target = targets.at(index % targets.length);
      const targetDate = await targetService.determineTargetDate({ countries, date, frequency, target });
      
      return {
        date,
        targetDate,
        name: nameFor[frequency](date),
      }
    }));
  };

  const extractDates = (before: { date: GSD }[], after: { date: GSD }[]) => [ 
    ...before.map(b => b.date), 
    ...after.map(a => a.date) ].sort(byIndexDesc)

  const extractHolidays = (before: { holidays: Holiday[] }[], after: { holidays: Holiday[] }[]) => [ 
    ...before.map(b => b.holidays), 
    ...after.map(a => a.holidays) ].flat().reduce((holidays: Holiday[], holiday) =>
      holidays.find(h => 
        isSameDate(h.date, holiday.date) &&
        h.locality == holiday.locality &&
        h.name === holiday.name) ? holidays : [ ...holidays, holiday ]
    , []);

  const generateScheduleSet = async ({ legalEntity, milestones, periods }: { legalEntity: LegalEntity, milestones: Array<Milestone>, periods: Array<Period> }) => {
    const workingDayService = WorkingDayService(u);

    return Promise.all(periods.map(async period => {
      const target = milestones.find(m => m.target === true) || milestones.at(0);
      if (target === undefined) throw new Error("No target milestone");

      const findBefore = (ms: Array<Milestone>) => ms.filter(m => m.index <= target.index).sort(byIndexDesc);
      const findAfter =  (ms: Array<Milestone>) => ms.filter(m => m.index >  target.index).sort(byIndexAsc);
        
      // Calculate milestone dates before due date
      let previous = period.targetDate;
  
      const before = await mapSeries(findBefore(milestones), async (milestone: Milestone) => {
        let holidays: Array<Holiday> = [];
        const ms = { ...milestone, date: previous };

        if (milestone.interval !== undefined && !Number.isNaN(milestone.interval)) {
          const countries = await getCountriesForMilestone({ milestone, legalEntityId: legalEntity.id });
          const result = await workingDayService.determinePrevious({ countries, start: previous, days: milestone.interval || 0 });
          previous = result.date;
          holidays = result.holidays;
        }
  
        return { holidays, date: { id: ms.id, date: ms.date, target: ms.target, index: ms.index }};
      });

      // Calculate milestone dates after due date
      let next = period.targetDate;
  
      const after = await mapSeries(findAfter(milestones), async (milestone: Milestone) => {
        const countries = await getCountriesForMilestone({ milestone, legalEntityId: legalEntity.id });
        const { date, holidays } = await workingDayService.determineNext({ countries, start: next, days: milestone.interval || 0 });
        next = date;
        const ms = { ...milestone, date: next };
        return { holidays, date: { id: ms.id, name: ms.identifier, date: ms.date, target: ms.target, index: ms.index }};
      });
  
      return { 
        period, 
        dates: extractDates(before, after), 
        holidays: extractHolidays(before, after) 
      };
    }));
  };

  const addSchedule = async (schedule: s.schedules.Insertable, txOrPool: TxOrPool = pool) => {
    return await db.upsert('schedules', { ...schedule, updatedBy: u }, 
      [ 'legalEntityId', 'date', 'status', 'version' ],
      { updateColumns: [ 'legalEntityId', 'name', 'date', 'status', 'version' ] }
    ).run(txOrPool);
  };

  const addScheduleDate = async (scheduleDate: s.scheduleDates.Insertable, txOrPool: TxOrPool = pool) => {
    return await db.upsert('scheduleDates', { ...scheduleDate, updatedBy: u }, 
      [ 'scheduleId', 'milestoneId' ],
      { updateColumns: [ 'scheduleId', 'milestoneId', 'date', 'status', 'index', 'target' ] }
    ).run(txOrPool);
  };

  const publish = (setId: string) => 
    arc.queues.publish({
      name: 'schedules-generated',
      payload: { setId, meta: { user: u }}
    });

  const saveScheduleSet = async ({ set, legalEntity }: { set: Array<GeneratedSchedule>, legalEntity: LegalEntity }) => {
    const holidayService = HolidaysService(u);
    const approvalsService = ApprovalsService(u);

    return db.serializable(pool, async tx => {
      let approvers = await approvalsService.listApproversByEntityId({ entityId: legalEntity.id }, tx);
      
      if (approvers.length === 0) 
        approvers = await approvalsService.addDefaultApprovers({ entityId: legalEntity.id }, tx);

      const { id: setId } = create();
      const dummy = { id: DEFAULT, entityId: DEFAULT, entity: DEFAULT, userId: null, userData: null, isOptional: null };

      await Promise.all(set.map(async (schedule) => {
        const { id } = await addSchedule(create({
          legalEntityId: legalEntity.id,
          name: schedule.period.name,
          date: schedule.period.date,
          status: Status.Draft,
          version: 0,
        }), tx);

        // @ts-ignore
        await approvalsService.addApprovals(approvers.concat(dummy)
          .map(({ userId, userData, isOptional }: any) => create({
            entity: "schedule,legal-entity", entityId: [ id, legalEntity.id ], 
            userId, userData, isOptional, setId, status: Status.Draft
          }))
        , tx);

        await holidayService.addHolidays(schedule.holidays.map(({ name, date, observed, locality }) => (
          create({ name, date, observed, locality, entity: "schedule", entityId: id })
        )), tx);

        await Promise.all(schedule.dates.map(async (date: any) => {
          await addScheduleDate(create({
            scheduleId: id,
            milestoneId: date.id,
            date: date.date,
            status: Status.Draft,
            index: date.index,
            target: date.target,
          }), tx);
        }));
      }));

      publish(setId);

      return setId;
    });
  };

  const generate = async ({ legalEntityId, start, end }: GenerateProps) => {
    const service = LegalEntityService(u);
    const legalEntity = await service.getLegalEntity({ id: legalEntityId });
    
    const milestoneService = MilestoneService(u);
    const milestones = await milestoneService.listMilestonesForLegalEntity({ legalEntity });
    const targetMilestone = milestones.find(m => m.target === true) || milestones.at(0);
    if (targetMilestone === undefined) throw new Error('No target milestone');
    const countries = await getCountriesForMilestone({ milestone: targetMilestone, legalEntityId });

    const dates = isAfter(start, end) ? { start: end, end: start } : { start, end };
    const periods = await determinePeriods({ legalEntity, countries, ...dates });
    const set = await generateScheduleSet({ legalEntity, milestones, periods });

    return saveScheduleSet({ set, legalEntity });
  };

  const requestGeneration = (params: { schedulables: Array<Schedulable>, start: Date, end: Date }) => {
    arc.queues.publish({
      name: 'schedules-requested',
      payload: { ...params, meta: { user: u }},      
    });
  };

  type ListProps = { 
    legalEntityId: string; 
    year?: number | undefined; 
    start?: Date | undefined;
    end?: Date | undefined;
    status: Status | null; 
  };

  const listSchedulesByLegalEntity = async ({ legalEntityId, year, start, end, status = Status.Draft }: ListProps, txOrPool: TxOrPool = pool) => {
    if (!status) status = Status.Draft;

    const yearQuery = year === undefined || start !== undefined ? db.sql``
      : db.sql`AND DATE_PART('year', ${'schedules'}.${'date'}) = ${db.param(year)}`;

    const dateQuery = start === undefined || end === undefined ? db.sql`` 
      : db.sql`AND ${'schedules'}.${'date'} BETWEEN ${db.param(format(start, 'yyyy-MM-dd'))} AND ${db.param(format(end, 'yyyy-MM-dd'))}`

    return db.sql<s.schedules.SQL | s.scheduleDates.SQL | s.approvals.SQL, Array<ScheduleWithDates>>`
      SELECT ${'schedules'}.*, a.*, sd.*
      FROM ${'schedules'} 
      LEFT JOIN LATERAL (
        SELECT COALESCE(JSON_AGG(${'scheduleDates'}.*), '[]') AS ${'scheduleDates'}
        FROM ${'scheduleDates'}
        WHERE ${'schedules'}.${'id'} = ${'scheduleDates'}.${"scheduleId"}
      ) sd ON TRUE
      LEFT JOIN LATERAL (
        SELECT COALESCE(JSON_AGG(${'approvals'}.*), '[]') AS ${'approvals'}
        FROM ${'approvals'}
        WHERE ${'schedules'}.${'id'} = ANY(${'approvals'}.${"entityId"}) AND 
          ${'approvals'}.${'userId'} IS NOT NULL
      ) a ON TRUE
      INNER JOIN (
        SELECT ${'legalEntityId'}, ${'date'}, ${'status'}, MAX(${'version'}) AS version
        FROM ${'schedules'} 
        GROUP BY ${'legalEntityId'}, ${'date'}, ${'status'}
      ) AS "maxVersion" 
        ON ${'schedules'}.${'legalEntityId'} = "maxVersion".${'legalEntityId'} AND
          ${'schedules'}.${'date'} = "maxVersion".${'date'} AND
          ${'schedules'}.${'status'} = "maxVersion".${'status'} AND
          ${'schedules'}.${'version'} = "maxVersion".${'version'}
      WHERE 
        ${'schedules'}.${'legalEntityId'} = ${db.param(legalEntityId)} AND 
        ${'schedules'}.${'status'} = ${db.param(status)}
        ${yearQuery}
        ${dateQuery}
      ORDER BY ${'schedules'}.${'date'} ASC
    `.run(txOrPool);
  };

  const listHolidaysForSchedules = async ({ legalEntityId, year, start, end, status }: ListProps, txOrPool: TxOrPool = pool) => {
    const service = HolidaysService(u);

    return db.serializable(txOrPool, async tx => {
      const milestones = await MilestoneService(u).listMilestonesForLegalEntityId({ legalEntityId }, undefined, tx);
      const schedules = await listSchedulesByLegalEntity({ legalEntityId, year, start, end, status }, tx);

      const countries = await Promise.all(milestones.map(async (milestone) => {
        return getCountriesForMilestone({ milestone, legalEntityId }, tx);
      }));

      const localities = countries.reduce((localities: Array<string>, country) =>
        localities.concat(country.reduce((localities: Array<string>, country: any) =>
          localities.concat(country.countries), [])), [])
        .reduce((localities: Array<string>, locality) => 
          localities.includes(locality) ? localities : [ ...localities, locality ], []);

      const holidays = await Promise.all(localities.map(async (locality: string) => {
        const holidays = await Promise.all(schedules.map(async ({ id: entityId }) => {
          return service.listHolidaysByCountryForEntity({ year, start, end, locality, entityId }, { includeMain: false }, tx);
        }));
        return holidays.flat();
      }));
      
      return holidays.flat().reduce((holidays: Array<Holiday>, holiday) =>
        holidays.filter(h => isSameDate(h.date, holiday.date) && h.locality === holiday.locality).length > 0
          ? holidays : [ ...holidays, holiday ], []);
    });
  };

  return { 
    generate, 
    changeDate, 
    requestGeneration,
    getScheduleById, 
    getScheduleByIdentity,
    getSchedules, 
    deleteSchedule, 
    listSchedulesByLegalEntity,
    listHolidaysForSchedules,
  };
};

export default Service;
