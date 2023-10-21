import { useEffect, useRef, useState } from 'react';
import { ActionArgs, json, redirect, type LoaderArgs } from '@remix-run/node';
import { useFetcher, useLoaderData, useNavigate, useSearchParams, useSubmit } from '@remix-run/react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

import { ArrowLongLeftIcon, ArrowLongRightIcon } from '@heroicons/react/20/solid';
import { ChatBubbleBottomCenterTextIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

import { notFound, badRequest } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';
import { useUser } from '~/hooks';
import { setFlashMessage, storage } from '~/utility/flash.server';

import LegalEntityService from '~/services/manage/legal-entities.server';
import ScheduleService, { type ScheduleWithDates, Status } from '~/services/scheduler/schedules.server';
import MilestoneService, { type Milestone } from '~/services/scheduler/milestones.server';
import { type Approval } from '~/services/scheduler/approvals.server';

import ConfirmModal, { type RefConfirmModal } from "~/components/modals/confirm";

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import { Alert, Level, Tabs } from '~/components';
import Table, { ColumnProps } from '~/components/table';
import { DatePicker, Form, withZod, z } from '~/components/form';

import { ApprovalsSummary } from '~/components/scheduler/approvals';

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
  const status = url.searchParams.get("status") || Status.Approved;

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
    const { schedule: { id, name }} = data;
    try {
      await service.deleteSchedule({ id });
      message = `Schedule Deleted:${name} has been deleted.`;
    } catch(e: any) {
      message = `Schedule Delete Error:${e.message}.`;
      level = Level.Error;
    };
  }

  if (intent === "change-date") {
    const { date, schedule: { id: scheduleId }, milestone: { id: milestoneId }} = data;
    return service.changeDate({ scheduleId, milestoneId, date });
  }

  const session = await setFlashMessage({ request, message, level });
  return redirect(`.?set=${setId}`, { headers: { "Set-Cookie": await storage.commitSession(session) } });
};

const Schedules = () => {
  const u = useUser();
  const { t } = useTranslation("schedule");
  const fetcher = useFetcher();

  const { schedules, milestones, year, status, statuses } = useLoaderData();

  const navigate = useNavigate();
  const [ searchParams ] = useSearchParams();

  const submit = useSubmit();
  const [ schedule, setSchedule ] = useState<ScheduleWithDates>();

  const [ editingDate, setEditingDate ] = useState<{ row: string, col: string }>();
  const [ submittingDate, setSubmittingDate ] = useState<{ row: string, col: string }>();

  const hasPermission = (p: string) => u.permissions.includes(p);

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

  const DisplayDate = ({ schedule, column }: { schedule: ScheduleWithDates, column: ColumnProps }) => {
    const scheduledDate = schedule.scheduleDates?.find(d => d?.milestoneId === column.name)?.date;
    if (scheduledDate === undefined) return;
    const asLocaleDate = format(new Date(scheduledDate), "dd/MM/yyyy"); //.toLocaleDateString(locale);
    const allowEdit = hasPermission(scheduler.edit.schedule); // && schedule.status === "approved";
    const row = schedule.id, col = column.name, 
          isEditing = editingDate?.row === row && editingDate?.col === col,
          isSubmitting = submittingDate?.row === row && submittingDate?.col === col;

    useEffect(() => {
      if (fetcher.state === "idle") setSubmittingDate(undefined);
    }, [ fetcher.state ]);
      
    const handleClick = (e: any) => {
      if (allowEdit === false) return;
      e.stopPropagation();
      setEditingDate(isEditing ? undefined : { row, col });
    };

    const handleChange = (date: Date) => {
      setSubmittingDate({ row, col });
      fetcher.submit({ intent: "change-date",  
        date: format(date, "yyyy-MM-dd"), schedule: { id: row }, milestone: { id: col }, 
      }, { method: "POST", encType: "application/json" });
    };

    return isEditing
      ? <Form validator={withZod(z.any())} className="-mt-4 -mb-2 -ml-3 -mr-9" onClick={handleClick}>
          <DatePicker value={new Date(scheduledDate)} label={null} displayFormat="dd/MM/yyyy" width={8} onChange={handleChange} />
        </Form>
      : <span className={classnames(allowEdit ? "cursor-pointer" : "", isSubmitting ? "opacity-50" : "", "inline-block")} 
          onClick={handleClick}>
          {asLocaleDate}
        </span>;
  };

  const columns = [
    { name: "name", label: "Period", className: "text-md font-medium" },
      ...milestones.map((m: Milestone) => ({ name: m.id, label: labelFor(m), 
        headingClassName: targetClassName(m), className: targetClassName(m),
        display: (schedule: ScheduleWithDates, column: ColumnProps) => 
          <DisplayDate schedule={schedule} column={column} /> })),
    { name: "version", label: "Version", condition: status !== "draft" },
    { name: "approvals", label: "Approvals", display: ({ approvals }: ScheduleWithDates) => <ApprovalsSummary approvals={approvals} user={u} /> },
    { name: "status", label: "Status", 
        display: ({ status }: ScheduleWithDates) => 
          <span className={status === "approved" ? "text-green-700" : status === "rejected" ? "text-red-700" : ""}>
            {t(status)}
          </span> 
    },
  ];

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

  const handleUnapprove = (schedule: ScheduleWithDates) => {
    submit({ intent: "unapprove", schedule: schedule.id },
      { method: "POST", action: `approve`, encType: "multipart/form-data" });
  };

  const handleApprove = (schedule: ScheduleWithDates | Array<ScheduleWithDates>) => {
    submit({ intent: "init", schedule: Array.isArray(schedule) ? schedule.map(s => s.id) : schedule.id },
      { method: "POST", action: `./approve`, encType: "multipart/form-data" });
  };

  const handleSelectApprovers = (schedule: ScheduleWithDates | Array<ScheduleWithDates>) => {
    if (Array.isArray(schedule) === false) return navigate(`./approvers?schedule=${(schedule as ScheduleWithDates).id}`)
    // @ts-ignore
    if (Array.isArray(schedule) && schedule.length === 1) return navigate(`./approvers?schedule=${schedule.at(0).id}`)
    submit({ intent: "init", schedule: (schedule as Array<ScheduleWithDates>).map(s => s.id) },
      { method: "POST", action: `./approvers`, encType: "application/json" });
  };

  const handleReject = (schedule: ScheduleWithDates | Array<ScheduleWithDates>) => {
    submit({ intent: "init", schedule: Array.isArray(schedule) ? schedule.map(s => s.id) : schedule.id },
      { method: "POST", action: `./reject`, encType: "multipart/form-data" });
  };

  const can = (permission: string, approvals: Array<Approval>) => 
    hasPermission(permission) && 
    approvals.filter(a => a.userId === u.id && a.status === "draft").length > 0;

  const actions = [
    { name: "approve", icon: CheckIcon,
      className: "text-gray-500", multiSelect: true,
      condition: (schedule: ScheduleWithDates) => ['draft', 'rejected'].includes(schedule.status) && can(scheduler.edit.schedule, schedule.approvals),
      onClick: handleApprove 
    },
    { name: "unapprove",
      className: "text-gray-500",
      condition: (schedule: ScheduleWithDates) => ['approved', 'rejected'].includes(schedule.status) && can(scheduler.edit.schedule, schedule.approvals),
      onClick: handleUnapprove
    },
    { name: "reject", icon: XMarkIcon,
      className: "text-gray-500", multiSelect: true, 
      condition: (schedule: ScheduleWithDates) => schedule.status === "draft" && can(scheduler.edit.schedule, schedule.approvals),
      onClick: handleReject
    },
    { name: "show-holidays", onClick: ({ id }: ScheduleWithDates) => navigate(`../holidays?schedule=${id}`), className: "text-gray-500" },
    { name: "select-approvers", onClick: handleSelectApprovers, 
      condition: () => hasPermission(scheduler.edit.schedule) && status === "draft",
      className: "text-gray-500", multiSelect: true, icon: ChatBubbleBottomCenterTextIcon },
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
