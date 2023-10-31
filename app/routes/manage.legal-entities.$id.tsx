import { type ActionArgs, type LoaderArgs, json, type UploadHandler,
  unstable_composeUploadHandlers as composeUploadHandlers,
  unstable_createMemoryUploadHandler as createMemoryUploadHandler,
  unstable_parseMultipartFormData as parseMultipartFormData } from '@remix-run/node';
import { useLoaderData, Outlet, useSearchParams } from '@remix-run/react';

import { createSupabaseUploadHandler } from '~/services/supabase.server';

import { WalletIcon, PlusIcon } from '@heroicons/react/24/outline';

import { badRequest, notFound } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';

import LegalEntityService, { LegalEntity } from '~/services/manage/legal-entities.server';
import Header from '~/components/header';
import { Breadcrumb, BreadcrumbProps } from '~/layout/breadcrumbs';
import { EditableImage } from '~/components';

import { manage } from '~/auth/permissions';

export const handle = {
  name: ({ legalEntity }: { legalEntity: LegalEntity }) => legalEntity?.name,
  path: ({ legalEntity }: { legalEntity: LegalEntity }) => legalEntity?.id,
  breadcrumb: (props: BreadcrumbProps) => <Breadcrumb {...props} />
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
    const file = formData.get('logo') as File;
    const service = LegalEntityService(u);
    const { logo } = await service.updateLegalEntity({ id, logo: file.name });
    return json({ logo });
  }
  return null;
};

export default function Provider() {
  const [ searchParams ] = useSearchParams();
  const { legalEntity: { id, name, localities, logo }} = useLoaderData();

  const tabs = [
    { name: 'info', to: 'info' },
    { name: 'people', to: 'people/worker' },
    { name: 'locations', to: 'locations' },
    { name: 'milestones', to: 'milestones' },
    { name: 'schedules', to: `/schedules/${id}/schedules` },
    { name: 'holidays', to: 'holidays' },
  ];

  const locality = searchParams.get("locality") || localities.at(0);
  const actions = [
    { title: 'add-holiday', to: `/holidays/${locality}/add?entity=legal-entity&entity-id=${id}`, default: true, icon: PlusIcon, permission: manage.edit.legalEntity },
  ];

  return (
    <>
      <Header title={name} tabs={tabs} actions={actions} group={true} 
        icon={<EditableImage name="logo" image={logo} Icon={WalletIcon} intent="change-logo" />} />
      <Outlet />
    </>
  );
};