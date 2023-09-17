import { json, type LoaderArgs } from '@remix-run/node';

import { badRequest, notFound } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';

import ClientService from '~/models/manage/clients.server';

export const loader = async ({ request, params }: LoaderArgs) => {
  const { name } = params;

  if (name === undefined) return badRequest('Invalid request');

  const u = await requireUser(request);

  const service = ClientService(u);
  const client = await service.getClientByName({ name }, { bypassKeyCheck: true });

  return json({ client });
};

export default () => null;
