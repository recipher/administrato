import { json, type LoaderArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import ServiceCentreService from '~/models/manage/service-centres.server';
import Alert, { Level } from '~/components/alert';
import { Basic as List } from '~/components/list';

import { Breadcrumb } from "~/layout/breadcrumbs";

import { notFound, badRequest } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';

export const handle = {
  breadcrumb: ({ serviceCentre, current }: { serviceCentre: any, current: boolean }) => 
    <Breadcrumb to={`/manage/service-centres/${serviceCentre?.id}/info`} name="info" current={current} />
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

const Info = () => {
  const { serviceCentre } = useLoaderData();

  return (
    <div></div>
  );
};

export default Info;
