import { json, type LoaderArgs } from '@remix-run/node';
import { useLoaderData, useNavigate, useSearchParams, useSubmit } from '@remix-run/react';
import { useTranslation } from 'react-i18next';
import { useLocale } from 'remix-i18next';

import { notFound, badRequest } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';

import LegalEntityService from '~/services/manage/legal-entities.server';
import ScheduleService, { ScheduleWithDates } from '~/services/scheduler/schedules.server';
import MilestoneService, { type Milestone } from '~/services/scheduler/milestones.server';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import Alert, { Level } from '~/components/alert';
import Tabs from '~/components/tabs';
import Table, { ColumnProps } from '~/components/table';

import toNumber from '~/helpers/to-number';

export const handle = {
  name: "schedules",
  breadcrumb: ({ legalEntity, current, name }: { legalEntity: any } & BreadcrumbProps) => 
    <Breadcrumb to={`/schedules/${legalEntity?.id}/schedules`} name={name} current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest('Invalid request');
  
  const url = new URL(request.url);
  const year = toNumber(url.searchParams.get("year") as string) || new Date().getFullYear();

  const u = await requireUser(request);

  const service = LegalEntityService(u);
  const legalEntity = await service.getLegalEntity({ id });
  if (legalEntity === undefined) return notFound('Legal entity not found');

  const milestoneService = MilestoneService(u);
  const milestones = await milestoneService.listMilestonesForLegalEntity({ legalEntity }, { sortDirection: "ASC" });

  const scheduleService = ScheduleService(u);
  const schedules = await scheduleService.listSchedulesByLegalEntity({ legalEntityId: id, year });

  return json({ legalEntity, schedules, milestones, year });
};

const Schedules = () => {
  const { t } = useTranslation("schedule");
  const locale = useLocale();

  const { legalEntity, schedules, milestones, year } = useLoaderData();

  const navigate = useNavigate();
  const [ searchParams ] = useSearchParams();

  const years = (year: number) => [...Array(5).keys()].map(index => year + index - 1);

  const tabs = years(new Date().getUTCFullYear())
    .map((year: number) => ({ name: year.toString() }));

  const handleClick = (year: string ) => {
    searchParams.set("year", year);
    navigate(`?${searchParams.toString()}`);
  };
  
  const targetClassName = (m: Milestone) => m.target === true ? "text-indigo-800 font-semibold": "";

  const columns = [
    { name: "name", label: "Period" },
      ...milestones.map((m: Milestone) => ({ name: m.id, label: `(${m.interval}) ${m.description}`, 
        headingClassName: targetClassName(m), className: targetClassName(m),
        display: (schedule: ScheduleWithDates, column: ColumnProps) => {
          const date = schedule.scheduleDates.find(d => d.milestoneId === column.name)?.date;
          return date && new Date(date).toLocaleDateString(locale);
        }})),
    { name: "status", label: "Status", display: ({ status }: { status: string }) => t(status) },
  ];

  return (
    <>
      <Tabs tabs={tabs} selected={year.toString()} onClick={handleClick} />

      {schedules.length === 0 && <Alert level={Level.Info} title={`No schedules for ${year}`} />}
    
      <Table data={schedules} columns={columns} showHeadings={true} />
    </>
  );
};

export default Schedules;
