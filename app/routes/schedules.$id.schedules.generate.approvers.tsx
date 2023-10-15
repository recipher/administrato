import { json, type LoaderArgs, type ActionArgs, redirect } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import { badRequest, notFound } from '~/utility/errors';

import { requireUser } from '~/auth/auth.server';
import { useUser } from '~/hooks';

import { setFlashMessage, storage } from '~/utility/flash.server';

import LegalEntityService from '~/services/manage/legal-entities.server';
import ApprovalsService, { create } from '~/services/scheduler/approvals.server';

import { Breadcrumb, BreadcrumbProps } from '~/layout/breadcrumbs';

import { Body, Section, Group, Field } from '~/components/form';
import { Level } from '~/components';

import { Approvers } from '~/components/scheduler/approvers';


export const handle = {
  name: [ "generate-schedules", "select-approvers" ],
  breadcrumb: ({ legalEntity, current, name }: { legalEntity: any } & BreadcrumbProps) => 
    [ <Breadcrumb to={`/schedules/${legalEntity?.id}/generate`} name={name.at(0) as string} current={current} />,
      <Breadcrumb to={`/schedules/${legalEntity?.id}/generate/approvers`} name={name.at(1) as string} current={current} /> ]
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const url = new URL(request.url);
  const setId = url.searchParams.get("set");

  const { id } = params;

  if (id === undefined || setId === null) return badRequest('Invalid request');

  const u = await requireUser(request);

  const service = LegalEntityService(u);
  const legalEntity = await service.getLegalEntity({ id });

  if (legalEntity === undefined) return notFound('Legal entity not found');

  const approvalsService = ApprovalsService(u);
  const approvers = await approvalsService.listApproversBySetId({ setId });

  return json({ legalEntity, approvers, setId });
};

export async function action({ request, params }: ActionArgs) {
  const u = await requireUser(request);

  let message = "", level = Level.Success;
  const { intent, setId, ...data } = await request.json();

  const service = ApprovalsService(u);

  if (intent === 'add-approver') {
    const { user, legalEntity } = data;
    try {
      await service.addApproverToSet({ setId, userId: user.id, userData: user });
      message = `Approver Added:${user.name} has been added as an approver for ${legalEntity.name}.`;
    } catch(e: any) {
      message = `Approver Add Error:${e.message}.`;
      level = Level.Error;
    };
  }

  if (intent === 'remove-approver') {
    const { user, legalEntity } = data;
    try {
      await service.removeApproverFromSet({ setId, userId: user.id });
      message = `Approver Removed:${user.name} has been removed as an approver for ${legalEntity.name}.`;
    } catch(e: any) {
      message = `Approver Remove Error:${e.message}.`;
      level = Level.Error;
    };
  }

  const session = await setFlashMessage({ request, message, level });
  return redirect(`.?set=${setId}`, { headers: { "Set-Cookie": await storage.commitSession(session) } });
};


export default function Generate() {
  const u = useUser();
  const { legalEntity, approvers, setId } = useLoaderData();

  return (
    <div className="mt-6">
      <Body border={false}>
        <Section heading='Select Approvers' 
          explanation='Add and remove approvers for this schedule set here.' />
        <Group>
          <Field span="full">
            <Approvers className="-mt-4" setId={setId}
              legalEntity={legalEntity} approvers={approvers} user={u} />
          </Field>
        </Group>
      </Body>
    </div>
  );
};