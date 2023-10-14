import { useTranslation } from 'react-i18next';
import { json, type LoaderArgs } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';

import LegalEntityService from '~/services/manage/legal-entities.server';
import MilestoneService from '~/services/scheduler/milestones.server';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import { Layout, Heading, Section, Field } from '~/components/info/info';

import { notFound, badRequest } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';

export const handle = {
  i18n: "schedule",
  name: "info",
  breadcrumb: ({ legalEntity, current, name }: { legalEntity: any } & BreadcrumbProps) => 
    <Breadcrumb to={`/schedules/${legalEntity?.id}/info`} name={name} current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest('Invalid request');

  const u = await requireUser(request);

  const service = LegalEntityService(u);
  const legalEntity = await service.getLegalEntity({ id });

  if (legalEntity === undefined) return notFound('Legal entity not found');

  const milestoneService = MilestoneService(u);
  const milestoneSet = await milestoneService.getMilestoneSetByIdOrDefault({ id: legalEntity.milestoneSetId });

  return json({ legalEntity, milestoneSet });
};

const Info = () => {
  const { t } = useTranslation();
  const { t: ts } = useTranslation("schedule");
  const { legalEntity, milestoneSet } = useLoaderData();

  return (
    <>
      <Layout>
        <Heading heading={t('info')} explanation={`Manage ${legalEntity.name}'s information.`} />
        <Section>
          <Field title="Schedule Frequency">
            {ts(legalEntity.frequency, { ns: "schedule" })}
          </Field>
          <Field title="Schedule Pay Date">
            {legalEntity.target.split(',').map((target: string) => {
                const [ type, value ] = target.split(' ');
                return `${ts(type)} ${value == null ? "" : ts(value)}`;
              }).join(' and ')}
          </Field>
          <Field title="Milestone Set">
            <Link className="text-indigo-900" to={`/milestones/${milestoneSet.id}/edit`}>
              {milestoneSet.identifier}
            </Link>
          </Field>
          <Field title="Provider">
            <Link className="text-indigo-900" to={`/manage/providers/${legalEntity.providerId}/info`}>
              {legalEntity.provider}
            </Link>
          </Field>
          <Field title="Service Centre Name">
            <Link className="text-indigo-900" to={`/manage/service-centres/${legalEntity.serviceCentreId}/info`}>
              {legalEntity.serviceCentre}
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
