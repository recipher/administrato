import { json, type LoaderArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import ProviderService from '~/models/manage/providers.server';
import Alert, { Level } from '~/components/alert';
import { Basic as List } from '~/components/list';

import { Breadcrumb } from "~/layout/breadcrumbs";

import { notFound, badRequest } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';

export const handle = {
  breadcrumb: ({ provider, current }: { provider: any, current: boolean }) => 
    <Breadcrumb to={`/manage/providers/${provider?.id}/holidays`} name="holidays" current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest('Invalid request');

  const u = await requireUser(request);

  const service = ProviderService(u);
  const provider = await service.getProvider({ id });

  if (provider === undefined) return notFound('Provider not found');

  return json({ provider });
};

const Holidays = () => {
  const { provider } = useLoaderData();

  return (
    <div></div>
  );
};

export default Holidays;
