import { useRef, useState } from 'react';
import { ActionArgs, json, redirect, type LoaderArgs } from '@remix-run/node';
import { useLoaderData, useNavigate, useSearchParams, useSubmit } from '@remix-run/react';
import { useTranslation } from 'react-i18next';
import { useLocale } from 'remix-i18next';

import { ArrowLongLeftIcon, ArrowLongRightIcon } from '@heroicons/react/20/solid';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

import { notFound, badRequest } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';
import { useUser } from '~/hooks';
import { setFlashMessage, storage } from '~/utility/flash.server';

import LegalEntityService from '~/services/manage/legal-entities.server';
import ScheduleService, { type ScheduleWithDates, Status } from '~/services/scheduler/schedules.server';
import MilestoneService, { type Milestone } from '~/services/scheduler/milestones.server';

import ConfirmModal, { type RefConfirmModal } from "~/components/modals/confirm";

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import Alert, { Level } from '~/components/alert';
import Tabs from '~/components/tabs';
import Table, { ColumnProps } from '~/components/table';

import { scheduler } from '~/auth/permissions';

import toNumber from '~/helpers/to-number';
import pluralize from '~/helpers/pluralize';
import classnames from '~/helpers/classnames';

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
  const status = url.searchParams.get("status") || Status.Draft;

  const u = await requireUser(request);

  const service = LegalEntityService(u);
  const legalEntity = await service.getLegalEntity({ id });
  if (legalEntity === undefined) return notFound('Legal entity not found');

  const milestoneService = MilestoneService(u);
  const milestones = await milestoneService.listMilestonesForLegalEntity({ legalEntity }, { sortDirection: "ASC" });

  const scheduleService = ScheduleService(u);
  const schedules = await scheduleService.listSchedulesByLegalEntity({ legalEntityId: id, year, status: status as Status });

  const statuses = Object.values(Status).filter(item => isNaN(Number(item)));

  return json({ legalEntity, schedules, milestones, year, status, statuses });
};

export async function action({ request, params }: ActionArgs) {
  const u = await requireUser(request);

  let message = "", level = Level.Success;
  const { intent, setId, ...data } = await request.json();

  const service = ScheduleService(u);

  if (intent === 'remove-schedule') {
    const { schedule: { id, name } } = data;
    try {
      await service.deleteSchedule({ id });
      message = `Schedule Deleted:${name} has been deleted.`;
    } catch(e: any) {
      message = `Schedule Delete Error:${e.message}.`;
      level = Level.Error;
    };
  }

  const session = await setFlashMessage({ request, message, level });
  return redirect(`.?set=${setId}`, { headers: { "Set-Cookie": await storage.commitSession(session) } });
};

const Schedules = () => {
  const user = useUser();
  const { t } = useTranslation("schedule");
  const locale = useLocale();

  const { schedules, milestones, year, status, statuses } = useLoaderData();

  const navigate = useNavigate();
  const [ searchParams ] = useSearchParams();

  const submit = useSubmit();
  const [ schedule, setSchedule ] = useState<ScheduleWithDates>();

  const yearData = ((year: number) => [...Array(5).keys()].map(index => year + index - 1))(new Date().getUTCFullYear())
    .map((year: number) => ({ name: year.toString() }));
  const statusData = statuses.map((status: Status) => ({ name: t(status), value: status }));
  const handleYearClick = (year: string) => handleClick("year", year);
  const handleStatusClick = (status: string) => handleClick("status", status);
  const handleClick = (param: string, value: string ) => {
    searchParams.set(param, value);
    navigate(`?${searchParams.toString()}`);
  };
  
  const targetClassName = (m: Milestone) => m.target === true ? "text-indigo-800 font-semibold": "";

  const confirm = useRef<RefConfirmModal>(null);

  const labelFor = (m: Milestone) => m.index === 0 
    ? m.description 
    : <span className={classnames(m.interval === 1 ? "lg:-ml-[4.5rem]" : "lg:-ml-[5rem]")}>
        <span className="hidden lg:inline">
          <ArrowLongLeftIcon className="h-4 w-4 inline" />
          <span className="text-sm font-normal">{m.interval} {pluralize('day', m.interval as number)}</span>
          <ArrowLongRightIcon className="h-4 w-4 inline" />
        </span>
        <span className="lg:ml-1.5">{m.description}</span>
      </span>;

  const columns = [
    { name: "name", label: "Period", className: "text-md font-medium" },
      ...milestones.map((m: Milestone) => ({ name: m.id, label: labelFor(m), 
        headingClassName: targetClassName(m), className: targetClassName(m),
        display: (schedule: ScheduleWithDates, column: ColumnProps) => {
          const date = schedule.scheduleDates.find(d => d?.milestoneId === column.name)?.date;
          return date && new Date(date).toLocaleDateString(locale === 'en' ? 'gb' : locale);
        }})),
    { name: "status", label: "Status", display: ({ status }: { status: string }) => t(status) },
  ];

  const hasPermission = (p: string) => user.permissions.includes(p);

  const handleRemove = (schedule: ScheduleWithDates) => {
    setSchedule(schedule);
    confirm.current?.show(
      "Remove Schedule?", 
      "Yes, Remove", "Cancel", 
      `Are you sure you want to remove the schedule for ${schedule.name} ${year}?`);
  };

  const onConfirmRemove = () => {
    if (schedule === undefined) return;
    submit({ intent: "remove-schedule", schedule: { id: schedule.id, name: `${schedule.name} ${year}` }},
      { method: "POST", encType: "application/json" });
  };

  const actions = [
    { name: "approve", icon: CheckIcon,
      className: () => "text-gray-500", multiSelect: true,
      condition: (schedule: ScheduleWithDates) => schedule.status === "draft" && hasPermission(scheduler.edit.schedule),
      to: (schedule: ScheduleWithDates | Array<string>) => `approve?schedule=${Array.isArray(schedule) ? schedule.join(',') : schedule.id}`,
    },
    { name: "reject", icon: XMarkIcon,
      className: () => "text-gray-500", multiSelect: true, 
      condition: (schedule: ScheduleWithDates) => schedule.status === "draft" && hasPermission(scheduler.edit.schedule),
      to: (schedule: ScheduleWithDates | Array<string>) => `reject?schedule=${Array.isArray(schedule) ? schedule.join(',') : schedule.id}`,
    },
    { name: "delete", 
      condition: (schedule: ScheduleWithDates) => schedule.status === "draft" && hasPermission(scheduler.delete.schedule),
      onClick: handleRemove,
    },
  ];

  return (
    <>
      <Tabs tabs={yearData} selected={year.toString()} onClick={handleYearClick} />
      <Tabs tabs={statusData} selected={status} onClick={handleStatusClick} />

      {schedules.length === 0 && <Alert level={Level.Info} title={`No ${t(status).toLowerCase()} schedules for ${year}`} />}
    
      <Table data={schedules} columns={columns} actions={actions}
             showHeadings={true} contextMenu={true} />
      <ConfirmModal ref={confirm} onYes={onConfirmRemove} />
    </>
  );
};

export default Schedules;
