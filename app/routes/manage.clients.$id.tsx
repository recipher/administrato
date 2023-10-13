import { type ActionArgs, type LoaderArgs, json, type UploadHandler,
  unstable_composeUploadHandlers as composeUploadHandlers,
  unstable_createMemoryUploadHandler as createMemoryUploadHandler,
  unstable_parseMultipartFormData as parseMultipartFormData } from '@remix-run/node';

import { createSupabaseUploadHandler } from '~/services/supabase.server';

import { IdentificationIcon } from '@heroicons/react/24/solid';
import { PlusIcon } from '@heroicons/react/24/outline';

import { badRequest, notFound } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';

import ClientService, { Client } from '~/services/manage/clients.server';
import { useLoaderData, Outlet, useSearchParams } from '@remix-run/react';
import Header from '~/components/header';
import { Breadcrumb, BreadcrumbProps } from '~/layout/breadcrumbs';
import { EditableImage } from '~/components';

import { manage } from '~/auth/permissions';

export const handle = {
  name: ({ client, parent }: { client: Client, parent: Client }) => parent !== null ?  [ parent?.name, "groups", client?.name ] : client?.name,
  breadcrumb: ({ client, parent, current, name }: { client: Client, parent: Client } & BreadcrumbProps) => {
    const crumb = <Breadcrumb key={client.id} to={`/manage/clients/${client?.id}`} name={Array.isArray(name) ? name[2] : name} current={current} />;
    
    return !parent ? crumb : [ 
      <Breadcrumb key={parent.id} to={`/manage/clients/${parent?.id}`} name={name[0]} />,
      <Breadcrumb key={`${parent.id}-r`} to={`/manage/clients/${parent?.id}/groups`} name={name[1]} />,
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

export const action = async ({ request, params }: ActionArgs) => {
  const u = await requireUser(request);
  const { id } = params;
  if (id === undefined) return badRequest('Invalid request');

  const uploadHandler: UploadHandler = composeUploadHandlers(
    createSupabaseUploadHandler({ bucket: "images" }),
    createMemoryUploadHandler()
  );

  const formData = await parseMultipartFormData(request, uploadHandler);

  if (formData.get("intent") === "change-logo") {
    const service = ClientService(u);
    const { logo } = await service.updateClient({ id, logo: formData.get('logo') as string });
    return json({ logo });
  }
  return null;
};

export default () => {
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

  return (
    <>
      <Header title={name} tabs={tabs} actions={actions} group={true} 
        icon={<EditableImage name="logo" image={logo} Icon={IdentificationIcon} intent="change-logo" />} />
      <Outlet />
    </>
  );
};
