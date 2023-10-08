import { json, type LoaderArgs } from '@remix-run/node';
import { Outlet, useLoaderData, useSearchParams } from '@remix-run/react';

import { CurrencyYenIcon, PlusIcon } from '@heroicons/react/24/outline';

import { badRequest, notFound } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';

import ProviderService from '~/services/manage/providers.server';

import Header from '~/components/header';
import { Breadcrumb, BreadcrumbProps } from '~/layout/breadcrumbs';

import { manage } from '~/auth/permissions';

export const handle = {
  name: ({ provider }: { provider: any }) => provider?.name,
  breadcrumb: ({ provider, current, name }: { provider: any } & BreadcrumbProps) => 
    <Breadcrumb to={`/manage/providers/${provider?.id}`} name={name} current={current} />
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
  const [ searchParams ] = useSearchParams();
  const { provider: { id, name, localities, logo }} = useLoaderData();

  const tabs = [
    { name: 'info', to: 'info' },
    { name: 'legal-entities', to: 'legal-entities' },
    { name: 'locations', to: 'locations' },
    { name: 'holidays', to: 'holidays' },
  ];

  const locality = searchParams.get("locality") || localities.at(0);
  const actions = [
    { title: 'add-holiday', to: `/holidays/${locality}/add?entity=provider&entity-id=${id}`, default: true, icon: PlusIcon, permission: manage.edit.provider },
  ];

  const icon = logo || <CurrencyYenIcon className="h-12 w-12 text-gray-300" aria-hidden="true" />;

  return (
    <>
      <Header title={name} tabs={tabs} actions={actions} group={true} icon={icon} />
      <Outlet />
    </>
  );
};
