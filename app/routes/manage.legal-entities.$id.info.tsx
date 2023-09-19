import { useTranslation } from 'react-i18next';
import { json, type LoaderArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import LegalEntityService from '~/models/manage/legal-entities.server';

import { Breadcrumb } from "~/layout/breadcrumbs";
import { Layout, Heading, Section, Field } from '~/components/info/info';

import { notFound, badRequest } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';

export const handle = {
  breadcrumb: ({ legalEntity, current }: { legalEntity: any, current: boolean }) => 
    <Breadcrumb to={`/manage/legal-entities/${legalEntity?.id}/info`} name="info" current={current} />
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
        <Heading heading={t('info')} explanation={`Manage ${legalEntity.name}'s information.`} />
        <Section>
          <Field title="Legal Entity Name">
            <p className="text-gray-900">{legalEntity.name}</p>
            <button type="button" className="hidden font-medium text-indigo-600 hover:text-indigo-500">
              Update
            </button>
          </Field>
        </Section>
      </Layout>
    </>
  );
};


export default Info;
