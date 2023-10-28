import { json, type LoaderArgs } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

import ProviderService from '~/services/manage/providers.server';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";

import { notFound, badRequest } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';
import { Layout, Heading, Section, Field } from '~/components/info/info';

export const handle = {
  name: "info",
  breadcrumb: (props: BreadcrumbProps) => <Breadcrumb {...props} />
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
          <Field title="Security Group Name">
            <Link className="text-indigo-900" to={`/manage/security-groups/${provider.securityGroupId}/info`}>
              {provider.securityGroup}
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
