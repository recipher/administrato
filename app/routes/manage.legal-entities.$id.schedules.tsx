import { json, type LoaderArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import LegalEntityService from '~/services/manage/legal-entities.server';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";

import { notFound, badRequest } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';

export const handle = {
  name: "schedules",
  breadcrumb: (props: BreadcrumbProps) => <Breadcrumb {...props} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest('Invalid request');

  const u = await requireUser(request);

  const service = LegalEntityService(u);
  const legalEntity = await service.getLegalEntity({ id });

  if (legalEntity === undefined) return notFound('Legal entity not found');

  return json({ legalEntity });
};

const Schedules = () => {
  const { legalEntity } = useLoaderData();

  return (
    <div></div>
  );
};

export default Schedules;
