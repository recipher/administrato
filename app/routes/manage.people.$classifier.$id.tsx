import { Outlet, useLoaderData } from '@remix-run/react';

import { type ActionArgs, type LoaderArgs, json, type UploadHandler,
  unstable_composeUploadHandlers as composeUploadHandlers,
  unstable_createMemoryUploadHandler as createMemoryUploadHandler,
  unstable_parseMultipartFormData as parseMultipartFormData } from '@remix-run/node';

import { createSupabaseUploadHandler } from '~/services/supabase.server';

import { badRequest, notFound } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';

import PersonService, { type Person, Classifier } from '~/services/manage/people.server';
import Header from '~/components/header';
import { EditableImage } from '~/components';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import { PlusIcon, UserCircleIcon } from '@heroicons/react/24/solid';

import { manage } from '~/auth/permissions';

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

export const action = async ({ request, params }: ActionArgs) => {
  const u = await requireUser(request);
  const { id } = params;
  if (id === undefined) return badRequest('Invalid request');

  const uploadHandler: UploadHandler = composeUploadHandlers(
    createSupabaseUploadHandler({ bucket: "images" }),
    createMemoryUploadHandler()
  );

  const formData = await parseMultipartFormData(request, uploadHandler);

  if (formData.get("intent") === "change-photo") {
    const service = PersonService(u);
    const { photo } = await service.updatePerson({ id, photo: formData.get('photo') as string });
    return json({ photo });
  }
  return null;
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

  const actions = [
    { title: 'add-document', to: 'add-document', default: true, icon: PlusIcon, permission: manage.edit.worker },
    { title: 'add-contact', to: 'add-contact', permission: manage.edit.worker },
    { title: 'add-salary', to: 'add-salary', permission: manage.edit.worker },
  ];

  return (
    <>
      <Header title={`${person.firstName} ${person.lastName}`} actions={actions} group={true}
        tabs={tabs.filter((tab) => tab.classifier === undefined || tab.classifier.includes(classifier))} 
          icon={<EditableImage name="photo" image={person.photo} Icon={UserCircleIcon} intent="change-photo" />} />
      <Outlet />
    </>
  );
};
