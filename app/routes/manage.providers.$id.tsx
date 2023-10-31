import { type ActionArgs, type LoaderArgs, json, type UploadHandler,
  unstable_composeUploadHandlers as composeUploadHandlers,
  unstable_createMemoryUploadHandler as createMemoryUploadHandler,
  unstable_parseMultipartFormData as parseMultipartFormData } from '@remix-run/node';
import { Outlet, useLoaderData, useSearchParams } from '@remix-run/react';

import { CurrencyYenIcon, PlusIcon } from '@heroicons/react/24/outline';

import { createSupabaseUploadHandler } from '~/services/supabase.server';

import { badRequest, notFound } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';

import ProviderService, { type Provider } from '~/services/manage/providers.server';

import Header from '~/components/header';
import { Breadcrumb, BreadcrumbProps } from '~/layout/breadcrumbs';
import { EditableImage } from '~/components';

import { manage } from '~/auth/permissions';

export const handle = {
  name: ({ provider }: { provider: Provider }) => provider?.name,
  path: ({ provider }: { provider: Provider }) => provider?.id,
  breadcrumb: (props: BreadcrumbProps) => <Breadcrumb {...props} />
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
    const service = ProviderService(u);
    const { logo } = await service.updateProvider({ id, logo: file.name });
    return json({ logo });
  }
  return null;
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

  return (
    <>
      <Header title={name} tabs={tabs} actions={actions} group={true} 
        icon={<EditableImage name="logo" image={logo} Icon={CurrencyYenIcon} intent="change-logo" />} />
      <Outlet />
    </>
  );
};
