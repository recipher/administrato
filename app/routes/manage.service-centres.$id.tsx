import { json, type LoaderArgs } from '@remix-run/node';
import { Outlet, useLoaderData } from '@remix-run/react';

import { badRequest, notFound } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';

import ServiceCentreService from '~/models/manage/service-centres.server';
import Header from '~/components/header/with-actions';

import { Breadcrumb } from "~/layout/breadcrumbs";

export const handle = {
  breadcrumb: ({ serviceCentre, current }: { serviceCentre: any, current: boolean }) => 
    <Breadcrumb to={`/manage/service-centres/${serviceCentre?.id}/info`} name={serviceCentre?.name} current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest('Invalid request');

  const u = await requireUser(request);

  const service = ServiceCentreService(u);
  const serviceCentre = await service.getServiceCentre({ id });

  if (serviceCentre === undefined) return notFound('Service centre not found');

  return json({ serviceCentre });
};

export default function ServiceCentre() {
  const { serviceCentre } = useLoaderData();

  const tabs = [
    { name: 'info', to: 'info' },
    { name: 'clients', to: 'clients' },
    { name: 'legal-entities', to: 'legal-entities' },
    { name: 'providers', to: 'providers' },
    { name: 'holidays', to: 'holidays' },
  ];
  
  // const actions = [
  //   { title: "sync", icon: ArrowPathIcon, type: ButtonType.Secondary, onClick: sync },
  //   { title: "add-holiday", to: "add", icon: PlusIcon },
  // ];

  return (
    <>
      <Header title={serviceCentre.name} tabs={tabs} />
      <Outlet />
    </>
  );
};
