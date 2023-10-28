import { useTranslation } from 'react-i18next';
import { json, type LoaderArgs } from '@remix-run/node';
import { useLoaderData, useSubmit } from '@remix-run/react';
import { format, formatRelative } from 'date-fns';

import { notFound, badRequest } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';
import { useUser } from '~/hooks';

import LegalEntityService from '~/services/manage/legal-entities.server';
import ScheduleService, { type ScheduleWithDates, type Schedule, Status } from '~/services/scheduler/schedules.server';
import { type Approval } from '~/services/scheduler/approvals.server';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import { Layout, Heading } from '~/components/info/info';
import { Alert, Level, Table } from '~/components';

import { ApprovalsSummary } from '~/components/scheduler/approvals';

import { scheduler } from '~/auth/permissions';

export const handle = {
  i18n: "schedule",
  name: "approvals",
  breadcrumb: (props: BreadcrumbProps) => <Breadcrumb {...props} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest('Invalid request');

  const url = new URL(request.url);
  const status = url.searchParams.get("status") || Status.Draft;

  const u = await requireUser(request);

  const service = LegalEntityService(u);
  const legalEntity = await service.getLegalEntity({ id });

  if (legalEntity === undefined) return notFound('Legal entity not found');
  
  const scheduleService = ScheduleService(u);
  const schedules = await scheduleService.listSchedulesByLegalEntity({ legalEntityId: id, status: status as Status });

  return json({ legalEntity, schedules });
};

export default function() {
  const u = useUser();
  const submit = useSubmit();
  const { t } = useTranslation();
  const { legalEntity, schedules } = useLoaderData();

  const columns = [
    { name: "user", display: (a: Approval) => (
      <div>
        {/* @ts-ignore */}
        <span className="text-md font-medium">{a.userData?.name}</span>
        {/* @ts-ignore */}
        <span className="text-sm px-3 text-gray-500">{a.userData?.email}</span>
      </div>) },
    { name: "status",
      display: ({ status }: Approval) => 
      <span className={status === "approved" ? "text-green-700" : status === "rejected" ? "text-red-700" : ""}>
        {t(status)}
      </span> 
    }, 
    { name: "at", display: (a: Approval) => formatRelative(new Date(a.updatedAt), new Date()) }
  ];

  const hasPermission = (p: string) => u.permissions.includes(p);

  const can = (permission: string, approval: Approval) => 
    hasPermission(permission) && approval.userId === u.id && approval.status === "draft";

  const handleApprove = (approval: Approval & { schedule: Schedule }) => {
    submit({ intent: "init", schedule: approval.schedule.id },
      { method: "POST", action: `../schedules/approve`, encType: "multipart/form-data" });
  };

  const handleReject = (approval: Approval & { schedule: Schedule }) => {
    submit({ intent: "init", schedule: approval.schedule.id },
      { method: "POST", action: `../schedules/reject`, encType: "multipart/form-data" });
  };
  
  const actions = [
    { name: "approve",
      className: "text-green-700",
      condition: (a: Approval) => ['draft', 'rejected'].includes(a.status) && can(scheduler.edit.schedule, a),
      onClick: handleApprove 
    },
    { name: "reject",
      className: "text-red-700", 
      condition: (a: Approval) => a.status === "draft" && can(scheduler.edit.schedule, a),
      onClick: handleReject
    },
  ];

  return (
    <>
      <Layout>
        <Heading heading={t('approvals')} explanation={`Manage ${legalEntity.name}'s schedule approvals.`} />
      
        {schedules.length <= 0 && <Alert title='No approvals' level={Level.Info} />}

        <>
          <ul role="list">
            {schedules.map((schedule: ScheduleWithDates) => (
              <li key={schedule.id} className="justify-between gap-x-6 py-4 cursor-pointer">
                <>
                  {/* @ts-ignore */}
                  <span className="font-medium text-md text-gray-900 pr-2">{schedule.name}</span>
                  <span className="font-normal pr-3">{format(new Date(schedule.date), 'yyyy')}</span>
                  {/* @ts-ignore */}
                  <span className="font-medium text-sm text-gray-500 pr-3">
                    <ApprovalsSummary approvals={schedule.approvals} user={u} />
                  </span>
                </>
                <Table data={schedule.approvals.map(a => ({ ...a, schedule }))} columns={columns} actions={actions} />
              </li>
            ))}
          </ul>
        </>
      </Layout>
    </>
  );
};
