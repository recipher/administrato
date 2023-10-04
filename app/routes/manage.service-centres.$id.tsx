import { json, type LoaderArgs } from '@remix-run/node';
import { Outlet, useLoaderData, useSearchParams } from '@remix-run/react';
import { PlusIcon } from '@heroicons/react/24/outline';

import { badRequest, notFound } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';

import ServiceCentreService from '~/models/manage/service-centres.server';
import Header from '~/components/header';
import { Flag } from '~/components/countries/flag';
import { manage } from '~/auth/permissions';

import { Breadcrumb } from "~/layout/breadcrumbs";

export const handle = {
  breadcrumb: ({ serviceCentre, parent, current }: { serviceCentre: any, parent: any, current: boolean }) => {
    const crumb = <Breadcrumb key={serviceCentre.id} to={`/manage/service-centres/${serviceCentre?.id}`} name={serviceCentre?.name } current={current} />;
    
    return !parent ? crumb : [ 
      <Breadcrumb key={parent.id} to={`/manage/service-centres/${parent?.id}`} name={parent?.name} />,
      <Breadcrumb key={`${parent.id}-r`} to={`/manage/service-centres/${parent?.id}/groups`} name="groups" />,
      crumb ];
  }
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest('Invalid request');

  const bypassKeyCheck = !!new URL(request.url).searchParams.get("bypass");

  const u = await requireUser(request);

  const service = ServiceCentreService(u);
  const serviceCentre = await service.getServiceCentre({ id }, { bypassKeyCheck });
  const parent = serviceCentre.parentId ? await service.getServiceCentre({ id: serviceCentre.parentId }) : null;

  if (serviceCentre === undefined && !bypassKeyCheck) return notFound('Service centre not found');

  return json({ serviceCentre, parent });
};

export default function ServiceCentre() {
  const [ searchParams ] = useSearchParams();
  const { serviceCentre: { id, name, localities, parentId }} = useLoaderData();

  const tabs = [
    { name: 'info', to: 'info' },
    { name: 'groups', to: 'groups', hidden: parentId !== null },
    { name: 'clients', to: 'clients' },
    { name: 'legal-entities', to: 'legal-entities' },
    { name: 'providers', to: 'providers' },
    { name: 'locations', to: 'locations' },
    { name: 'holidays', to: 'holidays' },
  ];

  const locality = searchParams.get("locality") || localities.at(0);
  const actions = [
    { title: 'add-group', to: `/manage/service-centres/${id}/add-group`, hidden: parentId !== null, permission: manage.edit.serviceCentre },
    { title: 'add-client', to: `/manage/clients/add?service-centre=${id}`, default: true, icon: PlusIcon, permission: manage.create.client },
    { title: 'add-legal-entity', to: `/manage/legal-entities/add?service-centre=${id}`, permission: manage.create.legalEntity },
    { title: 'add-provider', to: `/manage/providers/add?service-centre=${id}`, permission: manage.create.provider },
    { title: 'add-holiday', to: `/holidays/${locality}/add?entity=service-centre&entity-id=${id}`, default: true, icon: PlusIcon, permission: manage.edit.serviceCentre },
  ];

  return (
    <>
      <Header title={name} icon={<Flag isoCode={localities.at(0)} />} tabs={tabs} actions={actions} group={true} />
      <Outlet />
    </>
  );
};
