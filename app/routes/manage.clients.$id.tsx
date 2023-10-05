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
  breadcrumb: ({ client, parent, current }: { client: any, parent: any, current: boolean }) => {
    const crumb = <Breadcrumb key={client.id} to={`/manage/clients/${client?.id}`} name={client?.name } current={current} />;
    
    return !parent ? crumb : [ 
      <Breadcrumb key={parent.id} to={`/manage/clients/${parent?.id}`} name={parent?.name} />,
      <Breadcrumb key={`${parent.id}-r`} to={`/manage/clients/${parent?.id}/groups`} name="groups" />,
      crumb ];
  }
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest('Invalid request');

  const bypassKeyCheck = !!new URL(request.url).searchParams.get("bypass");

  const u = await requireUser(request);

  const service = ClientService(u);
  const client = await service.getClient({ id }, { bypassKeyCheck });
  const parent = client.parentId ? await service.getClient({ id: client.parentId }) : null;

  if (client === undefined && !bypassKeyCheck) return notFound('Client not found');

  return json({ client, parent });
};

export default function Client() {
  const [ searchParams ] = useSearchParams();
  const { client: { id, name, localities, logo, parentId }} = useLoaderData();

  const tabs = [
    { name: 'info', to: 'info' },
    { name: 'summary', to: 'summary' },
    { name: 'groups', to: 'groups', hidden: parentId !== null },
    { name: 'people', to: 'people/worker' },
    { name: 'locations', to: 'locations' },
    { name: 'holidays', to: 'holidays' },
  ];

  const locality = searchParams.get("locality") || localities.at(0);
  const actions = [
    { title: 'add-group', to: `/manage/clients/${id}/add-group`, hidden: parentId !== null, permission: manage.edit.client },
    { title: 'add-holiday', to: `/holidays/${locality}/add?entity=client&entity-id=${id}`, icon: PlusIcon, default: true, permission: manage.edit.client },
  ];

  const icon = logo || <IdentificationIcon className="h-12 w-12 text-gray-400" aria-hidden="true" />;

  return (
    <>
      <Header title={name} tabs={tabs} actions={actions} group={true} icon={icon} />
      <Outlet />
    </>
  );
};
