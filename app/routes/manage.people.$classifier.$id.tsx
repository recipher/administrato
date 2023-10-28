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
  name: ({ person }: { person: Person }) => person?.name,
  path: ({ person }: { person: Person }) => person?.id,
  breadcrumb: (props: BreadcrumbProps) => <Breadcrumb {...props} />
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

  const working = [ "worker", "employee", "contractor" ];
  const tabs = [
    { name: 'info', to: 'info' },
    { name: 'salary', to: 'salary', classifier: [ "worker", "employee" ] },
    { name: 'contracts', to: 'contracts', classifier: [ "contractor" ] },
    { name: 'addresses', to: 'addresses' },
    { name: 'contacts', to: 'contacts' },
    { name: 'documents', to: 'documents', classifier: working },
    { name: 'banking', to: 'banking', classifier: working },
    { name: 'dependents', to: 'dependents', classifier: working },
    { name: 'education', to: 'education', classifier: working },
  ];

  const actions = [
    { title: 'add-document', to: 'documents/add', default: true, icon: PlusIcon, permission: manage.edit.person },
    { title: 'add-address', to: 'addresses/add', permission: manage.edit.person },
    { title: 'add-contact', to: 'contacts/add', permission: manage.edit.person },
    { title: 'add-salary', to: 'salary/add', permission: manage.edit.person },
    { title: 'add-bank-account', to: 'banking/add', permission: manage.edit.person },
  ];

  return (
    <>
      <Header title={person.name} actions={actions} group={true}
        tabs={tabs.filter((tab) => tab.classifier === undefined || tab.classifier.includes(classifier))} 
          icon={<EditableImage name="photo" image={person.photo} Icon={UserCircleIcon} intent="change-photo" />} />
      <Outlet />
    </>
  );
};
