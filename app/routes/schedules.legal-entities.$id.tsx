import { useRef } from 'react';
import { json, type LoaderArgs, type ActionArgs, redirect } from '@remix-run/node';
import { useLoaderData, Outlet, useSubmit } from '@remix-run/react';

import { WalletIcon, PlusIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

import { badRequest, notFound } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';

import ScheduleService, { Status  } from '~/services/scheduler/schedules.server';
import LegalEntityService from '~/services/manage/legal-entities.server';

import Header from '~/components/header';
import { Breadcrumb, BreadcrumbProps } from '~/layout/breadcrumbs';
import { DownloadModal, validator } from '~/components/scheduler/download';
import { RefModal } from '~/components/modals/modal';
import { ButtonType } from '~/components';

import { scheduler } from '~/auth/permissions';
import toNumber from '~/helpers/to-number';

export const handle = {
  name: ({ legalEntity }: { legalEntity: any }) => legalEntity?.name,
  breadcrumb: ({ legalEntity, current, name }: { legalEntity: any } & BreadcrumbProps) => 
    <Breadcrumb to={`/schedules/legal-entities/${legalEntity?.id}`} name={name} current={current} />
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

  const statuses = Object.values(Status).filter(item => isNaN(Number(item)));

  return json({ legalEntity, year, status, statuses });
};

export default function Schedules() {
  const { legalEntity: { logo, ...legalEntity }, year, status, statuses } = useLoaderData();

  const modal = useRef<RefModal>(null);

  const tabs = [
    { name: 'info', to: 'info' },
    { name: 'summary', to: 'summary' },
    { name: 'schedules', to: 'schedules' },
    { name: 'approvals', to: 'approvals' },
    { name: 'approvers', to: 'approvers' },
    { name: 'holidays', to: 'holidays' },
  ];

  const actions = [
    // { title: 'download-schedule-file', href: `schedules/download?year=${year}`, download: `${year}.xlsx`,
    //   icon: ArrowDownIcon, permission: scheduler.read.schedule, type: ButtonType.Secondary },
    { title: 'download-schedule-file', onClick: () => modal.current?.show(),
      icon: ArrowDownIcon, permission: scheduler.read.schedule, type: ButtonType.Secondary },
    { title: 'generate-schedules', to: `schedules/generate?year=${year}`,
      default: true, icon: PlusIcon, permission: scheduler.create.schedule },
  ];

  const icon = (logo?.length && logo) || <WalletIcon className="h-12 w-12 text-gray-300" aria-hidden="true" />;

  return (
    <>
      <Header title={legalEntity.name} tabs={tabs} actions={actions} icon={icon} />
      <Outlet />
      <DownloadModal modal={modal} legalEntity={legalEntity} year={year} status={status} statuses={statuses} />
    </>
  );
};