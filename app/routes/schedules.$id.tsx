import { json, type LoaderArgs } from '@remix-run/node';
import { useLoaderData, Outlet, useSearchParams } from '@remix-run/react';

import { WalletIcon, PlusIcon } from '@heroicons/react/24/outline';

import { badRequest, notFound } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';

import LegalEntityService from '~/models/manage/legal-entities.server';
import Header from '~/components/header';
import { Breadcrumb, BreadcrumbProps } from '~/layout/breadcrumbs';

import { scheduler } from '~/auth/permissions';

export const handle = {
  name: ({ legalEntity }: { legalEntity: any }) => legalEntity?.name,
  breadcrumb: ({ legalEntity, current, name }: { legalEntity: any } & BreadcrumbProps) => 
    <Breadcrumb to={`/schedules/${legalEntity?.id}`} name={name} current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest('Invalid request');

  const u = await requireUser(request);

  const service = LegalEntityService(u);
  const legalEntity = await service.getLegalEntity({ id });

  if (legalEntity === undefined) return notFound('Legal entity not found');

  return json({ legalEntity });
};

export default function Provider() {
  const [ searchParams ] = useSearchParams();
  const { legalEntity: { id, name, localities, logo }} = useLoaderData();

  const tabs = [
    { name: 'schedules', to: 'schedules' },
    { name: 'info', to: 'info' },
    { name: 'approvals', to: 'approvals' },
    { name: 'approvers', to: 'approvers' },
    { name: 'holidays', to: 'holidays' },
  ];

  const actions = [
    { title: 'generate-schedules', to: 'generate', default: true, icon: PlusIcon, permission: scheduler.create.schedule },
  ];

  const icon = (logo.length && logo) || <WalletIcon className="h-12 w-12 text-gray-400" aria-hidden="true" />;

  return (
    <>
      <Header title={name} tabs={tabs} actions={actions} group={true} icon={icon} />
      <Outlet />
    </>
  );
};