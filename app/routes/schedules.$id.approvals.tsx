import { useTranslation } from 'react-i18next';
import { json, type LoaderArgs } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';

import LegalEntityService from '~/services/manage/legal-entities.server';
import ApprovalsService, { create, type Approval } from '~/services/scheduler/approvals.server';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import { Layout, Heading, Section, Field } from '~/components/info/info';
import { Alert, Level } from '~/components';

import { notFound, badRequest } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';

export const handle = {
  i18n: "schedule",
  name: "approvals",
  breadcrumb: ({ legalEntity, current, name }: { legalEntity: any } & BreadcrumbProps) => 
    <Breadcrumb to={`/schedules/${legalEntity?.id}/approvals`} name={name} current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest('Invalid request');

  const u = await requireUser(request);

  const service = LegalEntityService(u);
  const legalEntity = await service.getLegalEntity({ id });

  if (legalEntity === undefined) return notFound('Legal entity not found');
  
  const approvalsService = ApprovalsService(u);
  const approvals = await approvalsService.listApprovalsByEntityId({ entityId: id });

  return json({ legalEntity, approvals });
};

const Holidays = () => {
  const { t } = useTranslation();
  const { legalEntity, approvals } = useLoaderData();

  return (
    <>
      <Layout>
        <Heading heading={t('approvals')} explanation={`Manage ${legalEntity.name}'s schedule approvals.`} />
      
        {approvals.length <= 0 && <Alert title='No approvals' level={Level.Info} />}

        <div>{approvals.length}</div>
      </Layout>
    </>
  );
};

export default Holidays;
