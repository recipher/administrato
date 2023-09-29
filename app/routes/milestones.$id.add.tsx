import { type ActionArgs, redirect, json, LoaderArgs } from '@remix-run/node';
import { ValidatedForm as Form, validationError } from 'remix-validated-form';
import { withZod } from '@remix-validated-form/with-zod';
import { zfd } from 'zod-form-data';
import { z } from 'zod';

import { badRequest } from '~/utility/errors';

import MilestoneService from '~/models/scheduler/milestones.server';

import { Input, TextArea, Cancel, Submit,
         Body, Section, Group, Field, Footer } from '~/components/form';

import withAuthorization from '~/auth/with-authorization';

import { Breadcrumb } from "~/layout/breadcrumbs";
import { scheduler } from '~/auth/permissions';
import { requireUser } from '~/auth/auth.server';
import { setFlashMessage, storage } from '~/utility/flash.server';
import { Level } from '~/components/toast';

export const handle = {
  breadcrumb: ({ milestoneSet, current }: { milestoneSet: any, current: boolean }) => 
    <Breadcrumb to={`/milestones/${milestoneSet.id}/add`} name="add-milestone" current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest('Invalid data');

  const service = MilestoneService();
  const milestoneSet = await service.getMilestoneSetById({ id });
  const milestones = await service.getMilestonesBySet({ setId: Number(id) });

  return json({ milestoneSet, milestones });
};

const validator = withZod(zfd.formData({
  identifier: z
    .string()
    .nonempty("Milestone identifier is required"),
  description: z
    .string()
    .optional(),
}));

export const action = async ({ request, params }: ActionArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest('Invalid data');

  const u = await requireUser(request);
  const formData = await request.formData()

  const result = await validator.validate(formData);

  if (result.error) return json({ ...validationError(result.error) });

  const { data: { description = null, ...data }} = result;
  const ms = await MilestoneService().addMilestone({ description, setId: Number(id), ...data });

  const message = `Milestone Added:Milestone ${ms.identifier} successfully added.`;
  const level = Level.Success;
  const session = await setFlashMessage({ request, message, level });

  return redirect(`/milestones/${id}/edit`, {
    headers: { "Set-Cookie": await storage.commitSession(session) }
  });
};

const Add = () => {
  return (
    <>
      <Form method="post" validator={validator} id="add-milestone-set" className="mt-5">
        <Body>
          <Section heading='New Milestone' explanation='Please enter the new milestone details.' />
          <Group>
            <Field>
              <Input label="Identifier" name="identifier" placeholder="e.g. pay-date" />
            </Field>
            <Field>
              <TextArea label="Description" name="description" placeholder="e.g. Pay Date" />
            </Field>
            <Field width={50}>
              <Input label="Deadline" name="time" placeholder="e.g. pay-date" />
            </Field>
          </Group>
          <Section size="md" heading='Preceding Interval' explanation='Select how many days precede this milestone. The first milestone will always have an interval of zero days.' />
          <Group>
            <Field span={3}>
              <Input label="Interval in Days" name="description" placeholder="0" value="0" />
            </Field>
          </Group>
          <Section size="md" heading='Entities' explanation='Specify which entities this milestone applies to.' />
          <Group>
          </Group>
        </Body>
        <Footer>
          <Cancel />
          <Submit text="Save" submitting="Saving..." permission={scheduler.create.milestone} />
        </Footer>
      </Form>
    </>
  );
}

export default withAuthorization(scheduler.edit.milestone)(Add);