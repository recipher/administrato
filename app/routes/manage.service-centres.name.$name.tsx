import { json, type LoaderArgs } from '@remix-run/node';

import { badRequest, notFound } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';

import ServiceCentreService from '~/services/manage/service-centres.server';

export const loader = async ({ request, params }: LoaderArgs) => {
  const { name } = params;

  if (name === undefined) return badRequest('Invalid request');

  const u = await requireUser(request);

  const service = ServiceCentreService(u);
  const serviceCentre = await service.getServiceCentreByName({ name }, { bypassKeyCheck: true });

  return json({ serviceCentre });
};

export default () => null;
