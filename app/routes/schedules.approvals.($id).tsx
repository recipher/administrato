import { json, redirect, type LoaderArgs } from '@remix-run/node';
import { useLoaderData, useSubmit } from '@remix-run/react';
import { useTranslation } from 'react-i18next';
import { format, formatRelative } from 'date-fns';

import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

import { requireUser } from '~/auth/auth.server';
import { useUser } from '~/hooks';

import ApprovalService, { type Approval, Status } from '~/services/scheduler/approvals.server';
import LegalEntityService from '~/services/manage/legal-entities.server';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import Header from '~/components/header';
import { Alert, Level, Table } from '~/components';

import { scheduler } from '~/auth/permissions';

export const handle = {
  i18n: "schedule",
  name: "approvals",
  breadcrumb: ({ legalEntity, current, name }: { legalEntity: any } & BreadcrumbProps) => 
    <Breadcrumb to={`/schedules/legal-entities/${legalEntity?.id}/approvals`} name={name} current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const url = new URL(request.url);
  const status = url.searchParams.get("status") || Status.Draft;

  const u = await requireUser(request);
  
  const approvalService = ApprovalService(u);
  const approvals = await approvalService.listApprovalsByStatus({ userId: u.id, status: status as Status });

  const { id } = params;

  // @ts-ignore
  if (id === undefined && approvals.length) return redirect(`../approvals/${approvals.at(0)?.legalEntityId}`)

  const service = LegalEntityService(u);
  const legalEntity = id === undefined ? undefined : await service.getLegalEntity({ id });

  return json({ approvals, legalEntity });
};

export default function() {
  const u = useUser();
  const submit = useSubmit();
  const { approvals, legalEntity } = useLoaderData();

  const columns = [
    { name: "schedule", label: "Schedule", className: "w-full max-w-0 sm:w-auto sm:max-w-none", display: (a: Approval & { legalEntity: string, date: string, name: string }) =>
      <>
        <span className="font-medium pr-3">{a.name}</span>
        <span className="font-normal">{format(new Date(a.date), 'yyyy')}</span>
      </>
  },
    { name: "at", label: " ", className: "w-48", display: (a: Approval) => formatRelative(new Date(a.updatedAt), new Date()) }
  ];

  const hasPermission = (p: string) => u.permissions.includes(p);

  type ApprovalWithLegalEntity = Approval & { scheduleId: string, legalEntityId: string, legalEntity: string };

  const can = (permission: string, approval: Approval) => 
    hasPermission(permission) && approval.userId === u.id && approval.status === "draft";

  const handleApprove = (approval: ApprovalWithLegalEntity | Array<ApprovalWithLegalEntity>) => {
    submit({ intent: "init", schedule: Array.isArray(approval) ? approval.map(a => a.scheduleId) : approval.scheduleId },
      { method: "POST", action: `../legal-entities/${legalEntity.id}/schedules/approve`, encType: "multipart/form-data" });
  };

  const handleReject = (approval: ApprovalWithLegalEntity | Array<ApprovalWithLegalEntity>) => {
    submit({ intent: "init", schedule: Array.isArray(approval) ? approval.map(a => a.scheduleId) : approval.scheduleId },
      { method: "POST", action: `../legal-entities/${legalEntity.id}/schedules/reject`, encType: "multipart/form-data" });
  };
  
  const actions = [
    { name: "approve", icon: CheckIcon, multiSelect: true,
      className: "text-green-700",
      condition: (a: Approval) => ['draft', 'rejected'].includes(a.status) && can(scheduler.edit.schedule, a),
      onClick: handleApprove 
    },
    { name: "reject", icon: XMarkIcon, multiSelect: true,
      className: "text-red-700", 
      condition: (a: Approval) => a.status === "draft" && can(scheduler.edit.schedule, a),
      onClick: handleReject
    },
  ];

  type LegalEntity = { legalEntityId: string; legalEntity: string };
  const legalEntities = approvals.reduce((legalEntities: Array<LegalEntity>, { legalEntityId, legalEntity }: ApprovalWithLegalEntity) => 
    legalEntities.find(le => le.legalEntityId === legalEntityId) ? legalEntities : [ ...legalEntities, { legalEntityId, legalEntity, approvals: approvals.filter((a: ApprovalWithLegalEntity) => a.legalEntityId === legalEntityId) } ]
  , []);
  const tabs = legalEntities.map(({ legalEntity, legalEntityId, approvals }: any) => ({ name: legalEntity, to: `../approvals/${legalEntityId}`, count: approvals.length }));

  return (
    <>
      <Header title="Schedule Approvals" tabs={tabs} />
      {approvals.length <= 0 && <Alert title='You have no pending approvals' level={Level.Info} />}
      <Table data={approvals.filter((a: any) => a.legalEntityId === legalEntity.id)} columns={columns} actions={actions} showHeadings={true} />
    </>
  );
};
