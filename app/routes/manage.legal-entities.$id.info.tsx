import { useTranslation } from 'react-i18next';
import { json, type LoaderArgs } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';

import LegalEntityService from '~/services/manage/legal-entities.server';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import { Layout, Heading, Section, Field } from '~/components/info/info';

import { notFound, badRequest } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';

export const handle = {
  i18n: "schedule",
  name: "info",
  breadcrumb: ({ legalEntity, current, name }: { legalEntity: any } & BreadcrumbProps) => 
    <Breadcrumb to={`/manage/legal-entities/${legalEntity?.id}/info`} name={name} current={current} />
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
  const { t: ts } = useTranslation("schedule");
  const { legalEntity } = useLoaderData();

  return (
    <>
      <Layout>
        <Heading heading={t('info')} explanation={`Manage ${legalEntity.name}'s information.`} />
        <Section>
        <Field title="Legal Entity Name">
            <p className="text-gray-900">{legalEntity.name}</p>
            <button type="button" className="hidden group-hover:block font-medium text-indigo-600 hover:text-indigo-500">
              Change
            </button>
          </Field>
          <Field title="Schedule Frequency">
            {ts(legalEntity.frequency, { ns: "schedule" })}
          </Field>
          <Field title="Target Due Day">
            {legalEntity.target.split(',').map((target: string) => {
              const [ type, value ] = target.split(' ');
              return `${ts(type)} ${value == null ? "" : t(value)}`;
            }).join(' and ')}
          </Field>
          {legalEntity.clientId && <Field title="Client">
            <Link className="text-indigo-900" to={`/manage/clients/${legalEntity.clientId}/info`}>
              {legalEntity.client}
            </Link>
          </Field>}
          <Field title="Provider">
            <Link className="text-indigo-900" to={`/manage/providers/${legalEntity.providerId}/info`}>
              {legalEntity.provider}
            </Link>
            <button type="button" className="hidden group-hover:block font-medium text-indigo-600 hover:text-indigo-500">
              Change
            </button>
          </Field>
          {legalEntity.securityGroupId && <Field title="Security Group Name">
            <Link className="text-indigo-900" to={`/manage/security-groups/${legalEntity.securityGroupId}/info`}>
              {legalEntity.securityGroup}
            </Link>
            <button type="button" className="hidden font-medium text-indigo-600 hover:text-indigo-500">
              Update
            </button>
          </Field>}
        </Section>
      </Layout>
    </>
  );
};

export default Info;
