import { json, type LoaderArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

import { notFound, badRequest } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';

import LegalEntityService from '~/services/manage/legal-entities.server';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import { Stats } from '~/components';

export const handle = {
  i18n: "schedule",
  name: "summary",
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

const Summary = () => {
  const { t } = useTranslation();
  const { legalEntity } = useLoaderData();

  return (
    <>
      <Stats />
    </>
  );
};

export default Summary;
