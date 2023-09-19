import { json, type LoaderArgs } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

import WorkerService from '~/models/manage/workers.server';
import { requireUser } from '~/auth/auth.server';

import { Breadcrumb } from "~/layout/breadcrumbs";

import { notFound, badRequest } from '~/utility/errors';
import { Layout, Heading, Section, Field } from '~/components/info/info';

export const handle = {
  breadcrumb: ({ serviceCentre, current }: { serviceCentre: any, current: boolean }) => 
    <Breadcrumb to={`/manage/service-centres/${serviceCentre?.id}/info`} name="info" current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest('Invalid request');

  const u = await requireUser(request);

  const service = WorkerService(u);
  const worker = await service.getWorker({ id });

  if (worker === undefined) return notFound('Worker not found');

  return json({ worker });
};

const Info = () => {
  const { t } = useTranslation();
  const { worker } = useLoaderData();

  const name = `${worker.firstName} ${worker.lastName}`;

  return (
    <>
      <Layout>
        <Heading heading={t('info')} explanation={`Manage ${name}'s information.`} />
        <Section>
        <Field title="Worker Name">
            <p className="text-gray-900">{name}</p>
            <button type="button" className="hidden font-medium text-indigo-600 hover:text-indigo-500">
              Update
            </button>
          </Field>
          <Field title="Client">
            <p className="text-gray-900">
            <Link to={`/manage/clients/${worker.clientId}/info`}>{worker.client}</Link>
            </p>
          </Field>
          <Field title="Legal Entity">
            <p className="text-gray-900">
              <Link to={`/manage/legal-entities/${worker.legalEntityId}/info`}>{worker.legalEntity}</Link>
            </p>
          </Field>
        </Section>
      </Layout>
    </>
  );
};


export default Info;
