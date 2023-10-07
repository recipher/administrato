import { json, type LoaderArgs } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

import ProviderService from '~/models/manage/providers.server';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";

import { notFound, badRequest } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';
import { Layout, Heading, Section, Field } from '~/components/info/info';

export const handle = {
  name: "info",
  breadcrumb: ({ provider, current, name }: { provider: any } & BreadcrumbProps) => 
    <Breadcrumb to={`/manage/providers/${provider?.id}/info`} name={name} current={current} />
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
          <Field title="Service Centre Name">
            <Link className="text-indigo-900" to={`/manage/service-centres/${provider.serviceCentreId}/info`}>
              {provider.serviceCentre}
            </Link>
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
