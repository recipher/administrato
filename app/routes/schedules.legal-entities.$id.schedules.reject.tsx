import { json, type LoaderArgs, type ActionArgs, redirect } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import { badRequest, notFound } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';

import { setFlashMessage, storage } from '~/utility/flash.server';

import ApprovalsService from '~/services/scheduler/approvals.server';
import LegalEntityService from '~/services/manage/legal-entities.server';

import { Breadcrumb, BreadcrumbProps } from '~/layout/breadcrumbs';
import { Level } from '~/components/toast';

import { Cancel, Submit, Lookup, TextArea, 
  Body, Section, Group, Field, Footer, 
  Form, withZod, zfd, z, validationError } from '~/components/form';

import { scheduler } from '~/auth/permissions';

export const handle = {
  name: "reject",
  breadcrumb: ({ legalEntity, current, name }: { legalEntity: any } & BreadcrumbProps) => 
    <Breadcrumb to={`/schedules/legal-entities/${legalEntity?.id}/reject`} name={name} current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest('Invalid request');

  const url = new URL(request.url);
  const schedules = url.searchParams.get("schedule")?.split(',');

  const u = await requireUser(request);

  const service = LegalEntityService(u);
  const legalEntity = await service.getLegalEntity({ id });

  if (legalEntity === undefined) return notFound('Legal entity not found');

  return json({ legalEntity, schedules });
};

export const validator = withZod(
  zfd.formData({
    notes: z
      .string()
      .optional(),
    legalEntityId: z
      .string()
  })
);

export const action = async ({ request, params }: ActionArgs) => {
  const url = new URL(request.url);
  const schedules = url.searchParams.get("schedule")?.split(',');

  if (schedules === undefined) return badRequest('Invalid request');

  const u = await requireUser(request);
  const formData = await request.formData();
  const result = await validator.validate(formData);
  
  if (result.error) return validationError(result.error);

  let message = "", level = Level.Success;
  try {
    const service = ApprovalsService(u);
    await service.reject({ schedules, notes: result.data.notes as string });
    message = `Schedules Reject:${schedules.length} schedules have been rejected.`;
  } catch(e: any) {
    message = `Schedule Reject Error:${e.message}`;
    level = Level.Error;
  }

  const session = await setFlashMessage({ request, message, level });
  return redirect(`../schedules?status=rejected`, { headers: { "Set-Cookie": await storage.commitSession(session) } });
};

const noOp = () => null!

export default function Provider() {
  const { legalEntity: { logo, ...legalEntity }, schedules } = useLoaderData();

  return (
    <Form validator={validator} id="reject" method="POST" className="mt-6">
      <Body>
        <Section heading='Reject Schedules' 
          explanation='Are you sure you want to reject these schedules?' />
        <Group>
          <Field>
            <Lookup label='Legal Entity' name="legalEntityId" onClick={noOp} 
              value={legalEntity} />
          </Field>
        </Group>
        <Section />
        <Group>
          <Field>
            <TextArea name="notes" label="Rejection Notes" rows={3} />
          </Field>
        </Group>
      </Body>
      <Footer>
        <Cancel />
        <Submit text="Reject" submitting="Rejecting..." permission={scheduler.edit.schedule} />
      </Footer>
    </Form>
  );
};