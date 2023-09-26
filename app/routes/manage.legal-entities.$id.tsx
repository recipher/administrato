import { json, type LoaderArgs } from '@remix-run/node';
import { useLoaderData, Outlet, useSearchParams } from '@remix-run/react';

import { WalletIcon, PlusIcon } from '@heroicons/react/24/outline';

import { badRequest, notFound } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';

import LegalEntityService from '~/models/manage/legal-entities.server';
import Header from '~/components/header';
import { Breadcrumb } from '~/layout/breadcrumbs';

import { manage } from '~/auth/permissions';

export const handle = {
  breadcrumb: ({ legalEntity, current }: { legalEntity: any, current: boolean }) => 
    <Breadcrumb to={`/manage/legal-entities/${legalEntity?.id}`} name={legalEntity?.name} current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest('Invalid request');

  const bypassKeyCheck = !!new URL(request.url).searchParams.get("bypass");

  const u = await requireUser(request);

  const service = LegalEntityService(u);
  const legalEntity = await service.getLegalEntity({ id }, { bypassKeyCheck });

  if (legalEntity === undefined && !bypassKeyCheck) return notFound('Legal entity not found');

  return json({ legalEntity });
};

export default function Provider() {
  const [ searchParams ] = useSearchParams();
  const { legalEntity: { id, name, localities, logo }} = useLoaderData();

  const tabs = [
    { name: 'info', to: 'info' },
    { name: 'workers', to: 'workers' },
    { name: 'locations', to: 'locations' },
    { name: 'milestones', to: 'milestones' },
    { name: 'schedules', to: 'schedules' },
    { name: 'holidays', to: 'holidays' },
  ];

  const locality = searchParams.get("locality") || localities.at(0);
  const actions = [
    { title: 'add-holiday', to: `/holidays/${locality}/add?entity=legal-entity&entity-id=${id}`, default: true, icon: PlusIcon, permission: manage.edit.legalEntity },
  ];

  const icon = logo || <WalletIcon className="h-12 w-12 text-gray-400" aria-hidden="true" />;

  return (
    <>
      <Header title={name} tabs={tabs} actions={actions} group={true} icon={icon} />
      <Outlet />
    </>
  );
};