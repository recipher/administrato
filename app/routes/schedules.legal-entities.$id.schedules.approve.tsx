import { json, type LoaderArgs, type ActionArgs, redirect } from '@remix-run/node';
import { useActionData, useLoaderData } from '@remix-run/react';
import { format } from 'date-fns';

import { badRequest, notFound } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';

import { setFlashMessage, storage } from '~/utility/flash.server';

import ApprovalsService, { Status } from '~/services/scheduler/approvals.server';
import SchedulesService, { ScheduleWithDates, type Schedule } from '~/services/scheduler/schedules.server';
import LegalEntityService from '~/services/manage/legal-entities.server';

import { Breadcrumb, BreadcrumbProps } from '~/layout/breadcrumbs';
import { Level } from '~/components/toast';

import { Cancel, Submit, Lookup, TextArea,
  Body, Section, Group, Field, Footer, 
  Form, withZod, zfd, z, validationError, Hidden } from '~/components/form';

import { scheduler } from '~/auth/permissions';

export const handle = {
  name: "approve",
  breadcrumb: ({ legalEntity, current, name }: { legalEntity: any } & BreadcrumbProps) => 
    <Breadcrumb to={`/schedules/legal-entities/${legalEntity?.id}/approve`} name={name} current={current} />
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

export const validator = withZod(
  zfd.formData({
    notes: z
      .string()
      .optional(),
    legalEntityId: z
      .string(),
    schedules: z
      .string()
  })
);

export const action = async ({ request, params }: ActionArgs) => {
  const u = await requireUser(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  let message = "", level = Level.Success, status;
  const service = ApprovalsService(u);

  if (intent === "init") {
    const ids = formData.get("schedule")?.toString().split(',');
    if (ids === null) return badRequest('Invalid data');

    const schedulesService = SchedulesService(u);
    const schedules = await schedulesService.getSchedules({ ids });

    return json({ schedules });
  }

  if (intent === "approve") {
    const result = await validator.validate(formData);
    
    if (result.error) return validationError(result.error);
    
    try {
      const { schedules } = result.data;

      await service.approve({ schedules: schedules.split(','), notes: result.data.notes as string });
      // TODO get count
      message = `Schedule Approved:${schedules.length} schedules have been approved.`;
      status = Status.Approved;
    } catch(e: any) {
      message = `Schedule Approve Error:${e.message}`;
      level = Level.Error;
    }
  }

  if (intent === "unapprove") { 
    try {
      const schedule = formData.get("schedule");
      if (schedule === null) return badRequest('Invalid data');
      await service.unapprove({ schedules: [ schedule.toString() ], notes: "Unapproved" });
      // TODO get count
      message = `Schedules Unapproved:The schedule has been reverted to draft.`;
      status = Status.Draft;
    } catch(e: any) {
      message = `Schedule Unapprove Error:${e.message}`;
      level = Level.Error;
    }
  }

  const session = await setFlashMessage({ request, message, level });
  return redirect(`../schedules?status=${status}`, { headers: { "Set-Cookie": await storage.commitSession(session) } });
};

const noOp = () => null!

export default function Provider() {
  const { legalEntity: { logo, ...legalEntity } } = useLoaderData();
  const { schedules } = useActionData();

  const list = schedules.map((schedule: Schedule) => (
    <li key={schedule.id}>{`${schedule.name} ${format(new Date(schedule.date), 'yyyy')}`}</li>
  ));

  return (
    <Form validator={validator} id="approve" method="POST" className="mt-6">
      <Body>
        <Section heading='Approve Schedules' 
          explanation={
            <>
              <div>Are you sure you want to approve these schedules?</div>
              <ol className="mt-6 absolute columns-2">{list}</ol>
            </>
          } />
        <Group>
          <Field>
            <Hidden value="approve" name="intent" />
              <Hidden value={schedules.map((s: Schedule) => s.id).join(',')} name="schedules" />
            <Lookup label='Legal Entity' name="legalEntityId" onClick={noOp} 
              value={legalEntity} />
          </Field>
        </Group>
        <Section />
        <Group>
          <Field>
            <TextArea name="notes" label="Approval Notes" rows={3} />
          </Field>
        </Group>
      </Body>
      <Footer>
        <Cancel />
        <Submit text="Approve" submitting="Approving..." permission={scheduler.edit.schedule} />
      </Footer>
    </Form>
  );
};