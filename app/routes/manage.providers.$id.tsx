import { json, type LoaderArgs } from '@remix-run/node';

import { badRequest, notFound } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';

import ProviderService from '~/models/manage/providers.server';

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

export default () => null;
