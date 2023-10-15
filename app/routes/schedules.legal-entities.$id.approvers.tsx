import { useTranslation } from 'react-i18next';
import { json, redirect, type LoaderArgs, ActionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import { notFound, badRequest } from '~/utility/errors';

import { requireUser } from '~/auth/auth.server';
import { useUser } from '~/hooks';
import { setFlashMessage, storage } from '~/utility/flash.server';

import LegalEntityService from '~/services/manage/legal-entities.server';
import ApprovalsService, { create } from '~/services/scheduler/approvals.server';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import { Layout, Heading } from '~/components/info/info';
import { Level } from '~/components';

import { Approvers } from '~/components/scheduler/approvers';

export const handle = {
  i18n: "schedule",
  name: "approvers",
  breadcrumb: ({ legalEntity, current, name }: { legalEntity: any } & BreadcrumbProps) => 
    <Breadcrumb to={`/schedules/legal-entities/${legalEntity?.id}/approvers`} name={name} current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest('Invalid request');

  const u = await requireUser(request);

  const service = LegalEntityService(u);
  const legalEntity = await service.getLegalEntity({ id });

  if (legalEntity === undefined) return notFound('Legal entity not found');

  const approvalsService = ApprovalsService(u);
  const approvers = await approvalsService.listApproversByEntityId({ entityId: id });

  return json({ legalEntity, approvers });
};

export async function action({ request, params }: ActionArgs) {
  const u = await requireUser(request);

  let message = "", level = Level.Success;
  const { intent, ...data } = await request.json();

  const service = ApprovalsService(u);

  if (intent === 'add-approver') {
    const { user, legalEntity } = data;
    try {
      await service.addApprover(create({ 
        entity: "legal-entity", entityId: legalEntity.id,
        userId: user.id, userData: user, isOptional: false,
      }));
      message = `Approver Added:${user.name} has been added as an approver for ${legalEntity.name}.`;
    } catch(e: any) {
      message = `Approver Add Error:${e.message}.`;
      level = Level.Error;
    };
  }
  if (intent === 'remove-approver') {
    const { approver: { id }, user, legalEntity } = data;
    try {
      await service.removeApprover({ id });
      message = `Approver Removed:${user.name} has been removed as an approver for ${legalEntity.name}.`;
    } catch(e: any) {
      message = `Approver Remove Error:${e.message}.`;
      level = Level.Error;
    };
  }

  const session = await setFlashMessage({ request, message, level });
  return redirect(".", { headers: { "Set-Cookie": await storage.commitSession(session) } });
};

export default function () {
  const u = useUser();
  const { t } = useTranslation();
  const { legalEntity, approvers } = useLoaderData();

  return (
    <>
      <Layout>
        <Heading heading={t('approvers')} explanation={`Select ${legalEntity.name}'s default schedule approvers.`} />

        <Approvers className="mt-6" legalEntity={legalEntity} approvers={approvers} user={u} />
      </Layout>
    </>
  );
};
