import { json, type LoaderArgs } from '@remix-run/node';
import { Outlet, useLoaderData } from '@remix-run/react';

import { badRequest, notFound } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';

import ProviderService from '~/models/manage/providers.server';

import Header from '~/components/header';
import { Breadcrumb } from '~/layout/breadcrumbs';

export const handle = {
  breadcrumb: ({ provider, current }: { provider: any, current: boolean }) => 
    <Breadcrumb to={`/manage/providers/${provider?.id}`} name={provider?.name} current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest('Invalid request');

  const bypassKeyCheck = !!new URL(request.url).searchParams.get("bypass");

  const u = await requireUser(request);

  const service = ProviderService(u);
  const provider = await service.getProvider({ id }, { bypassKeyCheck });

  if (provider === undefined && !bypassKeyCheck) return notFound('Provider not found');

  return json({ provider });
};

export default function Provider() {
  const { provider } = useLoaderData();

  const tabs = [
    { name: 'info', to: 'info' },
    { name: 'legal-entities', to: 'legal-entities' },
    { name: 'holidays', to: 'holidays' },
  ];

  return (
    <>
      <Header title={provider.name} tabs={tabs} />
      <Outlet />
    </>
  );
};
