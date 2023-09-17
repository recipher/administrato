import { json, type LoaderArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import ClientService from '~/models/manage/clients.server';
import Alert, { Level } from '~/components/alert';
import { Basic as List } from '~/components/list';

import { Breadcrumb } from "~/layout/breadcrumbs";

import { notFound, badRequest } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';

export const handle = {
  breadcrumb: ({ client, current }: { client: any, current: boolean }) => 
    <Breadcrumb to={`/manage/clients/${client?.id}/info`} name="info" current={current} />
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

const Info = () => {
  const { client } = useLoaderData();

  return (
    <div></div>
  );
};

export default Info;
