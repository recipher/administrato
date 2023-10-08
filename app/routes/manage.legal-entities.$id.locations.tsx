import { useTranslation } from 'react-i18next';
import { json, type LoaderArgs } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';

import LegalEntityService from '~/services/manage/legal-entities.server';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import { Layout, Heading, Section, Field } from '~/components/info/info';

import { notFound, badRequest } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';

export const handle = {
  name: "locations",
  breadcrumb: ({ legalEntity, current, name }: { legalEntity: any } & BreadcrumbProps) => 
    <Breadcrumb to={`/manage/legal-entities/${legalEntity?.id}/locations`} name={name} current={current} />
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

const Info = () => {
  const { t } = useTranslation();
  const { legalEntity } = useLoaderData();

  return (
    <>
      <Layout>
        <Heading heading={t('info')} explanation={`Specify ${legalEntity.name}'s locations.`} />
      </Layout>
    </>
  );
};

export default Info;
