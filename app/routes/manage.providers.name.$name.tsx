import { json, type LoaderArgs } from '@remix-run/node';

import { badRequest, notFound } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';

import ProviderService from '~/services/manage/providers.server';

export const loader = async ({ request, params }: LoaderArgs) => {
  const { name } = params;

  if (name === undefined) return badRequest('Invalid request');

  const u = await requireUser(request);

  const service = ProviderService(u);
  const provider = await service.getProviderByName({ name }, { bypassKeyCheck: true });

  return json({ provider });
};

export default () => null;
