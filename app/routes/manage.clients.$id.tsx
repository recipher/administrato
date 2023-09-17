import { json, type LoaderArgs } from '@remix-run/node';

import { badRequest, notFound } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';

import ClientService from '~/models/manage/clients.server';

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest('Invalid request');

  const bypassKeyCheck = !!new URL(request.url).searchParams.get("bypass");

  const u = await requireUser(request);

  const service = ClientService(u);
  const client = await service.getClient({ id }, { bypassKeyCheck });

  if (client === undefined && !bypassKeyCheck) return notFound('Client not found');

  return json({ client });
};

export default () => null;
