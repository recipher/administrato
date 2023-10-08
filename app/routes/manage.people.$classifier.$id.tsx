import { json, type LoaderArgs } from '@remix-run/node';
import { Outlet, useLoaderData } from '@remix-run/react';

import { badRequest, notFound } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';

import PersonService, { type Person, Classifier } from '~/services/manage/people.server';
import Header from '~/components/header';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import { UserCircleIcon } from '@heroicons/react/24/solid';

export const handle = {
  name: ({ person }: { person: Person }) => `${person?.firstName} ${person?.lastName}`,
  breadcrumb: ({ person, classifier, current, name }: { person: Person, classifier: Classifier } & BreadcrumbProps) => 
    <Breadcrumb to={`/manage/people/${classifier}/${person?.id}/info`} name={name} current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id, classifier } = params;

  if (id === undefined || classifier === undefined) return badRequest('Invalid request');

  const u = await requireUser(request);

  const service = PersonService(u);
  const person = await service.getPerson({ id });

  if (person === undefined) return notFound('Person not found');

  return json({ person, classifier });
};

export default function Person() {
  const { person, classifier } = useLoaderData();

  const tabs = [
    { name: 'info', to: 'info' },
    { name: 'salary', to: 'salary', classifier: [ "worker", "employee" ] },
    { name: 'contracts', to: 'contracts', classifier: [ "contractor" ] },
    { name: 'contacts', to: 'contacts' },
    { name: 'documents', to: 'documents' },
  ];

  const icon = person.photo 
    ? person.photo 
    : <UserCircleIcon className="h-12 w-12 text-indigo-300" aria-hidden="true" />

  return (
    <>
      <Header title={`${person.firstName} ${person.lastName}`} 
        tabs={tabs.filter((tab) => tab.classifier === undefined || tab.classifier.includes(classifier))} icon={icon} />
      <Outlet />
    </>
  );
};
