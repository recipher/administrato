import { json, type LoaderArgs } from '@remix-run/node';
import { Outlet, useLoaderData } from '@remix-run/react';
import { PlusIcon } from '@heroicons/react/24/outline';

import { badRequest, notFound } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';

import ServiceCentreService from '~/models/manage/service-centres.server';
import Header from '~/components/header';
import { Flag } from '~/components/countries/countries';
import { manage } from '~/auth/permissions';

import { Breadcrumb } from "~/layout/breadcrumbs";

export const handle = {
  breadcrumb: ({ serviceCentre, current }: { serviceCentre: any, current: boolean }) => 
    <Breadcrumb to={`/manage/service-centres/${serviceCentre?.id}/info`} name={serviceCentre?.name} current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest('Invalid request');

  const bypassKeyCheck = !!new URL(request.url).searchParams.get("bypass");

  const u = await requireUser(request);

  const service = ServiceCentreService(u);
  const serviceCentre = await service.getServiceCentre({ id }, { bypassKeyCheck });

  if (serviceCentre === undefined && !bypassKeyCheck) return notFound('Service centre not found');

  return json({ serviceCentre });
};

export default function ServiceCentre() {
  const { serviceCentre: { id, name, localities } } = useLoaderData();

  const tabs = [
    { name: 'info', to: 'info' },
    { name: 'groups', to: 'groups' },
    { name: 'clients', to: 'clients' },
    { name: 'legal-entities', to: 'legal-entities' },
    { name: 'providers', to: 'providers' },
    { name: 'locations', to: 'locations' },
    { name: 'holidays', to: 'holidays' },
  ];

  const actions = [
    { title: 'add-group', to: `/manage/service-centres/${id}/add`, default: true, icon: PlusIcon, permission: manage.edit.serviceCentre },
    { title: 'add-client', to: `/manage/clients/add?service-centre=${id}`, permission: manage.create.client },
    { title: 'add-legal-entity', to: `/manage/legal-entities/add?service-centre=${id}`, permission: manage.create.legalEntity },
  ];

  return (
    <>
      <Header title={name} icon={<Flag isoCode={localities.at(0)} />}  tabs={tabs} actions={actions} group={true} />
      <Outlet />
    </>
  );
};
