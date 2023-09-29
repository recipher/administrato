import { type ActionArgs, redirect, json } from '@remix-run/node';
import { ValidatedForm as Form, validationError } from 'remix-validated-form';
import { withZod } from '@remix-validated-form/with-zod';
import { zfd } from 'zod-form-data';
import { z } from 'zod';

import { badRequest } from '~/utility/errors';

import MilestoneService from '~/models/scheduler/milestones.server';

import { Input, Cancel, Submit,
         Body, Section, Group, Field, Footer } from '~/components/form';

import { Breadcrumb } from "~/layout/breadcrumbs";
import withAuthorization from '~/auth/with-authorization';
import { scheduler } from '~/auth/permissions';
import { requireUser } from '~/auth/auth.server';
import { setFlashMessage, storage } from '~/utility/flash.server';
import { Level } from '~/components/toast';

export const handle = {
  breadcrumb: ({ current }: { current: boolean }) => 
    <Breadcrumb to='/milestones/sets/add' name="add-milestone-set" current={current} />
};

const validator = withZod(zfd.formData({
  identifier: z
    .string()
    .nonempty("Milestone identifier is required")
}));

export const action = async ({ request, params }: ActionArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest('Invalid data');

  const u = await requireUser(request);
  const formData = await request.formData()

  const result = await validator.validate(formData);

  if (result.error) return json({ ...validationError(result.error) });

  const ms = await MilestoneService().addMilestone({ ...result.data, setId: Number(id) });

  const message = `Milestone Added` //`Milestone Added:Milestone ${ms.identifier} successfully added.`;
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
              <Input label="Milestone Identifier" name="identifier" placeholder="e.g. Pay Date" />
            </Field>
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