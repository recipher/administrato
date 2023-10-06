import { json, type LoaderArgs } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

import ClientService from '~/models/manage/clients.server';
import { Layout, Heading, Section, Field } from '~/components/info/info';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";

import { notFound, badRequest } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';

export const handle = {
  name: () => "info",
  breadcrumb: ({ client, current, name }: { client: any } & BreadcrumbProps) => 
    <Breadcrumb to={`/manage/clients/${client?.id}/info`} name={name} current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest('Invalid request');

  const u = await requireUser(request);

  const service = ClientService(u);
  const client = await service.getClient({ id });

  if (client === undefined) return notFound('Client not found');

  return json({ client });
};

const Info = () => {
  const { t } = useTranslation();
  const { client } = useLoaderData();

  return (
    <>
      <Layout>
        <Heading heading={t('info')} explanation={`Manage ${client.name}'s information.`} />
        <Section>
          <Field title="Client Name">
            {!client.parentId && <p className="text-gray-900">{client.name}</p>}
            {client.parentId && <Link className="text-indigo-900" to={`/manage/clients/${client.parentId}/info`}>
              {client.parent}
            </Link>}
            <button type="button" className="hidden font-medium text-indigo-600 hover:text-indigo-500">
              Update
            </button>
          </Field>
          {client.parentId && <Field title="Group Name">
            <p className="text-gray-900">{client.name}</p>
            <button type="button" className="hidden font-medium text-indigo-600 hover:text-indigo-500">
              Update
            </button>
          </Field>}
          <Field title="Service Centre Name">
            <Link className="text-indigo-900" to={`/manage/service-centres/${client.serviceCentreId}/info`}>
              {client.serviceCentre}
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
