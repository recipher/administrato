import { json, type LoaderArgs } from '@remix-run/node';
import { Outlet, useLoaderData } from '@remix-run/react';

import { badRequest, notFound } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';

import WorkerService from '~/models/manage/workers.server';
import Header from '~/components/header';

import { Breadcrumb } from "~/layout/breadcrumbs";
import { UserCircleIcon } from '@heroicons/react/24/solid';

export const handle = {
  breadcrumb: ({ worker, current }: { worker: any, current: boolean }) => 
    <Breadcrumb to={`/manage/workers/${worker?.id}/info`} name={`${worker?.firstName} ${worker?.lastName}`} current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest('Invalid request');

  const u = await requireUser(request);

  const service = WorkerService(u);
  const worker = await service.getWorker({ id });

  if (worker === undefined) return notFound('Worker not found');

  return json({ worker });
};

export default function ServiceCentre() {
  const { worker } = useLoaderData();

  const tabs = [
    { name: 'info', to: 'info' },
    { name: 'location', to: 'location' },
  ];

  const icon = worker.photo 
    ? worker.photo 
    : <UserCircleIcon className="h-12 w-12 text-indigo-500" aria-hidden="true" />

  return (
    <>
      <Header title={`${worker.firstName} ${worker.lastName}`} tabs={tabs} icon={icon} />
      <Outlet />
    </>
  );
};
