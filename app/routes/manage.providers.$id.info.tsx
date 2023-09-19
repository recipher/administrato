import { json, type LoaderArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

import ProviderService from '~/models/manage/providers.server';

import { Breadcrumb } from "~/layout/breadcrumbs";

import { notFound, badRequest } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';
import { Layout, Heading, Section, Field } from '~/components/info/info';

export const handle = {
  breadcrumb: ({ provider, current }: { provider: any, current: boolean }) => 
    <Breadcrumb to={`/manage/providers/${provider?.id}/info`} name="info" current={current} />
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


const Info = () => {
  const { t } = useTranslation();
  const { provider } = useLoaderData();

  return (
    <>
      <Layout>
        <Heading heading={t('info')} explanation={`Manage ${provider.name}'s information.`} />
        <Section>
          <Field title="Provider Name">
            <p className="text-gray-900">{provider.name}</p>
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
