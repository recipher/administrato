import { json, type LoaderArgs } from '@remix-run/node';
import { Outlet, useLoaderData } from '@remix-run/react';

import { badRequest, notFound } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';

import PersonService from '~/models/manage/people.server';
import Header from '~/components/header';

import { Breadcrumb } from "~/layout/breadcrumbs";
import { UserCircleIcon } from '@heroicons/react/24/solid';

export const handle = {
  breadcrumb: ({ person, current }: { person: any, current: boolean }) => 
    <Breadcrumb to={`/manage/workers/${person?.id}/info`} name={`${person?.firstName} ${person?.lastName}`} current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest('Invalid request');

  const u = await requireUser(request);

  const service = PersonService(u);
  const person = await service.getPerson({ id });

  if (person === undefined) return notFound('Worker not found');

  return json({ person });
};

export default function Worker() {
  const { person } = useLoaderData();

  const tabs = [
    { name: 'info', to: 'info' },
    { name: 'location', to: 'location' },
  ];

  const icon = person.photo 
    ? person.photo 
    : <UserCircleIcon className="h-12 w-12 text-indigo-500" aria-hidden="true" />

  return (
    <>
      <Header title={`${person.firstName} ${person.lastName}`} tabs={tabs} icon={icon} />
      <Outlet />
    </>
  );
};
