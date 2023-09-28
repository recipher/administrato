import { json, type LoaderArgs } from '@remix-run/node';

import { IdentificationIcon } from '@heroicons/react/24/solid';
import { PlusIcon } from '@heroicons/react/24/outline';

import { badRequest, notFound } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';

import ClientService from '~/models/manage/clients.server';
import { useLoaderData, Outlet, useSearchParams } from '@remix-run/react';
import Header from '~/components/header';
import { Breadcrumb } from '~/layout/breadcrumbs';

import { manage } from '~/auth/permissions';

export const handle = {
  breadcrumb: ({ client, current }: { client: any, current: boolean }) => 
    <Breadcrumb to={`/manage/clients/${client?.id}`} name={client?.name} current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest('Invalid request');

  const bypassKeyCheck = !!new URL(request.url).searchParams.get("bypass");

  const u = await requireUser(request);

  const service = ClientService(u);
  const client = await service.getClient({ id }, { bypassKeyCheck });

  if (client === undefined && !bypassKeyCheck) return notFound('Client not found');

  return json({ client });
};

export default function Client() {
  const [ searchParams ] = useSearchParams();
  const { client: { id, name, localities, logo }} = useLoaderData();

  const tabs = [
    { name: 'info', to: 'info' },
    { name: 'summary', to: 'summary' },
    { name: 'groups', to: 'groups' },
    { name: 'workers', to: 'workers' },
    { name: 'locations', to: 'locations' },
    { name: 'holidays', to: 'holidays' },
  ];

  const locality = searchParams.get("locality") || localities.at(0);
  const actions = [
    { title: 'add-group', to: `/manage/clients/${id}/add-group`, default: true, icon: PlusIcon, permission: manage.edit.client },
    { title: 'add-holiday', to: `/holidays/${locality}/add?entity=client&entity-id=${id}`, permission: manage.edit.client },
  ];

  const icon = logo || <IdentificationIcon className="h-12 w-12 text-gray-400" aria-hidden="true" />;

  return (
    <>
      <Header title={name} tabs={tabs} actions={actions} group={true} icon={icon} />
      <Outlet />
    </>
  );
};
