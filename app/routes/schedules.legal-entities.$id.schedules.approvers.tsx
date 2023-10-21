import { json, type LoaderArgs, type ActionArgs, redirect } from '@remix-run/node';
import { useLoaderData, useActionData } from '@remix-run/react';
import { format } from 'date-fns';

import { badRequest, notFound } from '~/utility/errors';

import { requireUser } from '~/auth/auth.server';
import { useUser } from '~/hooks';

import { setFlashMessage, storage } from '~/utility/flash.server';

import LegalEntityService from '~/services/manage/legal-entities.server';
import ApprovalsService, { create, Status } from '~/services/scheduler/approvals.server';
import SchedulesService, { type Schedule } from '~/services/scheduler/schedules.server';

import { Breadcrumb, BreadcrumbProps } from '~/layout/breadcrumbs';

import { Body, Section, Group, Field } from '~/components/form';
import { Level } from '~/components';

import { Approvers } from '~/components/scheduler/approvers';


export const handle = {
  name: "select-approvers",
  breadcrumb: ({ legalEntity, current, name }: { legalEntity: any } & BreadcrumbProps) => 
    <Breadcrumb to={`/schedules/legal-entities/${legalEntity?.id}/approvers`} name={name} current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const url = new URL(request.url);
  const setId = url.searchParams.get("set");
  const scheduleId = url.searchParams.get("schedule");

  const { id } = params;

  if (id === undefined) return badRequest('Invalid request');

  const u = await requireUser(request);

  const service = LegalEntityService(u);
  const legalEntity = await service.getLegalEntity({ id });

  if (legalEntity === undefined) return notFound('Legal entity not found');

  const approvers = setId 
    ? await ApprovalsService(u).listApproversBySetId({ setId }) 
    : scheduleId 
      ? await ApprovalsService(u).listApprovalsByEntityId({ entityId: scheduleId }) 
      : undefined;

  const schedule = scheduleId 
    ? await SchedulesService(u).getScheduleById({ id: scheduleId })
    : undefined;
  
  return json({ legalEntity, approvers, setId, scheduleId, schedule });
};

export async function action({ request, params }: ActionArgs) {
  const u = await requireUser(request);

  let message = "", level = Level.Success, redirectTo = '../schedules';
  const { intent, ...data } = await request.json();

  const service = ApprovalsService(u);

  if (intent === "init") {
    const ids = data.schedule;
    if (ids === null) return badRequest('Invalid data');

    const schedulesService = SchedulesService(u);
    const schedules = await schedulesService.getSchedules({ ids, status: Status.Draft });

    return json({ schedules });
  }

  const { user, legalEntity, setId, schedules } = data;

  if (setId === undefined && schedules === undefined) {
    message = `Approver Error:No schedule data is available.`
    level = Level.Error;
    const session = await setFlashMessage({ request, message, level });
    return redirect(redirectTo, { headers: { "Set-Cookie": await storage.commitSession(session) } });
  }

  if (intent === 'add-approver') {
    try {
      if (setId) {
        await service.addApproverToSet({ setId, userId: user.id, userData: user });
        message = `Approver Added:${user.name} has been added as an approver for ${legalEntity.name}.`;
        redirectTo = `.?set=${setId}`;
      } else {
        await service.addApprovals(schedules.map((scheduleId: string) => create({
          entity: 'schedule,legal-entity', entityId: [ scheduleId, legalEntity.id ], userId: user.id, userData: user, status: Status.Draft
        })));
        message = `Approver Added:${user.name} has been added as an approver for ${legalEntity.name}.`;
        if (schedules.length === 1) redirectTo = `.?schedule=${schedules.at(0)}`;
      }
    } catch(e: any) {
      message = `Approver Add Error:${e.message}.`;
      level = Level.Error;
    };
  }

  if (intent === 'remove-approver') {
    try {
      if (setId) {
        await service.removeApproverFromSet({ setId, userId: user.id });
        redirectTo = `.?set=${setId}`;
      } else {
        await service.removeApprovalByEntityIdAndUserId({ entityId: schedules.at(0), userId: user.id });
        redirectTo = `.?schedule=${schedules.at(0)}`;
      }
      message = `Approver Removed:${user.name} has been removed as an approver for ${legalEntity.name}.`;
    } catch(e: any) {
      message = `Approver Remove Error:${e.message}.`;
      level = Level.Error;
    };
  }

  const session = await setFlashMessage({ request, message, level });
  return redirect(redirectTo, { headers: { "Set-Cookie": await storage.commitSession(session) } });
};

export default function Generate() {
  const u = useUser();
  const { legalEntity, approvers, setId, scheduleId, schedule } = useLoaderData();
  const data = useActionData();

  const schedules = schedule ? [ schedule ] : data?.schedules;
  const scheduleIds = scheduleId ? [ scheduleId ] : schedules?.map((s: Schedule) => s.id)

  const list = schedules?.map((schedule: Schedule) => (
    <li key={schedule.id}>{`${schedule.name} ${format(new Date(schedule.date), 'yyyy')}`}</li>
  ));

  return (
    <div className="mt-6">
      <Body border={false}>
        <Section heading='Select Approvers' 
          explanation={list 
            ? <>
                <div>Select an approver for these schedules.</div>
                <ol className="mt-6 absolute columns-2">{list}</ol>
              </>
            : "Add and remove approvers for this schedule set."
          }/>
        <Group>
          <Field span="full">
            <div className="-mt-4">
              <Approvers setId={setId} schedules={scheduleIds}
                legalEntity={legalEntity} approvers={approvers} user={u} />
            </div>
          </Field>
        </Group>
      </Body>
    </div>
  );
};