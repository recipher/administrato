import { json, type LoaderArgs } from '@remix-run/node';
import { useLoaderData, Outlet } from '@remix-run/react';

import { badRequest, notFound } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';

import LegalEntityService from '~/models/manage/legal-entities.server';
import Header from '~/components/header';
import { Breadcrumb } from '~/layout/breadcrumbs';

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
  const { legalEntity } = useLoaderData();

  const tabs = [
    { name: 'info', to: 'info' },
    { name: 'workers', to: 'workers' },
    { name: 'milestones', to: 'milestones' },
    { name: 'schedules', to: 'schedules' },
    { name: 'holidays', to: 'holidays' },
  ];

  return (
    <>
      <Header title={legalEntity.name} tabs={tabs} />
      <Outlet />
    </>
  );
};