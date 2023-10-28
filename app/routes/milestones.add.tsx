import { type ActionArgs, redirect, json } from '@remix-run/node';
import { Form, validationError, withZod, zfd, z } from '~/components/form';

import MilestoneService, { create } from '~/services/scheduler/milestones.server';

import { UniqueInput, Cancel, Submit,
         Body, Section, Group, Field, Footer } from '~/components/form';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import withAuthorization from '~/auth/with-authorization';
import { scheduler } from '~/auth/permissions';
import { requireUser } from '~/auth/auth.server';
import { setFlashMessage, storage } from '~/utility/flash.server';
import { Level } from '~/components/toast';

export const handle = {
  name: "add-milestone-set",
  path: "add",
  breadcrumb: (props: BreadcrumbProps) => <Breadcrumb {...props} />
};

const schema = zfd.formData({
  identifier: z
    .string()
    .nonempty("Set identifier is required")
});

const clientValidator = withZod(schema);

export const action = async ({ request }: ActionArgs) => {
  const u = await requireUser(request);

  const validator = withZod(schema.superRefine(
    async (data, ctx) => {
      const service = MilestoneService(u);
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

  const formData = await request.formData()

  const result = await validator.validate(formData);

  if (result.error) return json({ ...validationError(result.error) });

  const set = await MilestoneService(u).addMilestoneSet(create({ ...result.data }));

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
              <UniqueInput label="Milestone Set Identifier" name="identifier" placeholder="e.g. Default"
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