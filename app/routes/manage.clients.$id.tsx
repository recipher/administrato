import { json, type LoaderArgs } from '@remix-run/node';

import { badRequest, notFound } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';

import ClientService from '~/models/manage/clients.server';
import { useLoaderData, Outlet } from '@remix-run/react';
import Header from '~/components/header';
import { Breadcrumb } from '~/layout/breadcrumbs';

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
  const { client } = useLoaderData();

  const tabs = [
    { name: 'info', to: 'info' },
    { name: 'workers', to: 'workers' },
    { name: 'holidays', to: 'holidays' },
  ];

  return (
    <>
      <Header title={client.name} tabs={tabs} />
      <Outlet />
    </>
  );
};
