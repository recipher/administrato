import { json, type LoaderArgs } from '@remix-run/node';

import { badRequest, notFound } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';

import LegalEntityService from '~/services/manage/legal-entities.server';

export const loader = async ({ request, params }: LoaderArgs) => {
  const { name } = params;

  if (name === undefined) return badRequest('Invalid request');

  const u = await requireUser(request);

  const service = LegalEntityService(u);
  const legalEntity = await service.getLegalEntityByName({ name }, { bypassKeyCheck: true });

  return json({ legalEntity });
};

export default () => null;
