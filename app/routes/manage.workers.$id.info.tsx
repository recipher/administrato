import { json, type LoaderArgs } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

import PersonService from '~/models/manage/people.server';
import { requireUser } from '~/auth/auth.server';

import { Breadcrumb } from "~/layout/breadcrumbs";

import { notFound, badRequest } from '~/utility/errors';
import { Layout, Heading, Section, Field } from '~/components/info/info';

export const handle = {
  breadcrumb: ({ worker, current }: { worker: any, current: boolean }) => 
    <Breadcrumb to={`/manage/workers/${worker?.id}/info`} name="info" current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest('Invalid request');

  const u = await requireUser(request);

  const service = PersonService(u);
  const person = await service.getPerson({ id });

  if (person === undefined) return notFound('Worker not found');

  return json({ person });
};

const Info = () => {
  const { t } = useTranslation();
  const { person } = useLoaderData();

  const name = `${person.firstName} ${person.lastName}`;

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
            <Link className="text-indigo-900" to={`/manage/clients/${person.clientId}/info`}>{person.client}</Link>
          </Field>
          <Field title="Legal Entity">
            <Link className="text-indigo-900" to={`/manage/legal-entities/${person.legalEntityId}/info`}>{person.legalEntity}</Link>
          </Field>
        </Section>
      </Layout>
    </>
  );
};


export default Info;
