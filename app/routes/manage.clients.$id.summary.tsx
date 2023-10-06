import { json, type LoaderArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

import ClientService from '~/models/manage/clients.server';
import Stats from '~/components/stats';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";

import { notFound, badRequest } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';

export const handle = {
  name: () => "summary",
  breadcrumb: ({ client, current, name }: { client: any } & BreadcrumbProps) => 
    <Breadcrumb to={`/manage/clients/${client?.id}/summary`} name={name} current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest('Invalid request');

  const u = await requireUser(request);

  const service = ClientService(u);
  const client = await service.getClient({ id });

  if (client === undefined) return notFound('Client not found');

  return json({ client });
};

export default () => {
  const { t } = useTranslation();
  const { client } = useLoaderData();

  return (
    <>
      <Stats />
    </>
  );
};

