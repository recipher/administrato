import { type ActionArgs, redirect, json } from '@remix-run/node';
import { useActionData, useSubmit } from '@remix-run/react'
import { ValidatedForm as Form, useFormContext, validationError } from 'remix-validated-form';
import { withZod } from '@remix-validated-form/with-zod';
import { zfd } from 'zod-form-data';
import { z } from 'zod';

import MilestoneService from '~/models/scheduler/milestones.server';

import { Input, UniqueInput, Select, Cancel, Submit, Checkbox,
         Body, Section, Group, Field, Footer } from '~/components/form';

import type { RefModal } from '~/components/modals/modal';
import { CountriesModal } from '~/components/countries/countries';

import { Breadcrumb } from "~/layout/breadcrumbs";
import withAuthorization from '~/auth/with-authorization';
import { scheduler } from '~/auth/permissions';
import Button, { ButtonType } from '~/components/button';
import { requireUser } from '~/auth/auth.server';
import refreshUser from '~/auth/refresh.server';
import { setFlashMessage, storage } from '~/utility/flash.server';
import { Level } from '~/components/toast';

export const handle = {
  breadcrumb: ({ current }: { current: boolean }) => 
    <Breadcrumb to='/milestones/sets/add' name="add-milestone-set" current={current} />
};

const schema = zfd.formData({
  identifier: z
    .string()
    .nonempty("Set identifier is required")
});

const clientValidator = withZod(schema);

export const action = async ({ request }: ActionArgs) => {
  const validator = withZod(schema.superRefine(
    async (data, ctx) => {
      const service = MilestoneService();
      if (data.identifier) {
        const set = await service.getMilestoneSetById({ id: data.identifier });
        if (set !== undefined) 
          ctx.addIssue({
            message: "This identifier is already in use",
            path: [ "identifier" ],
            code: z.ZodIssueCode.custom,
          });
      }
    }
  ));

  const u = await requireUser(request);
  const formData = await request.formData()

  const result = await validator.validate(formData);

  if (result.error) return json({ ...validationError(result.error) });

  const set = await MilestoneService().addMilestoneSet({ ...result.data });

  const message = `Milestone Set Added:Milestone set ${set.identifier} successfully added.`;
  const level = Level.Success;
  const session = await setFlashMessage({ request, message, level });

  return redirect(`/milestones/${set.id}`, {
    headers: { "Set-Cookie": await storage.commitSession(session) }
  });
};

const Add = () => {
  return (
    <>
      <Form method="post" validator={clientValidator} id="add-milestone-set">
        <Body>
          <Section heading='New Milestone Set' explanation='Please enter the new milestone set details.' />
          <Group>
            <Field>
              <UniqueInput label="Milestone Set Identifier" name="identifier" placeholder="e.g. Scotland"
                checkUrl="/milestones" property="milestoneSet" message="This identifier is already in use" />
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

export default withAuthorization(scheduler.create.milestone)(Add);