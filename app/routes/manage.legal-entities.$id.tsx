import { json, type LoaderArgs } from '@remix-run/node';

import { badRequest, notFound } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';

import LegalEntityService from '~/models/manage/legal-entities.server';

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest('Invalid request');

  const bypassKeyCheck = !!new URL(request.url).searchParams.get("bypass");

  const u = await requireUser(request);

  const service = LegalEntityService(u);
  const legalEntity = await service.getLegalEntity({ id }, { bypassKeyCheck });

  if (legalEntity === undefined && !bypassKeyCheck) return notFound('Legal entity not found');

  return json({ legalEntity });
};

export default () => null;
