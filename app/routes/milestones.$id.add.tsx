import { type ActionArgs, redirect, json, LoaderArgs } from '@remix-run/node';
import { useTranslation } from 'react-i18next';
import { Form, validationError, withZod, zfd, z } from '~/components/form';

import { badRequest } from '~/utility/errors';

import MilestoneService, { create } from '~/services/scheduler/milestones.server';

import { Input, TextArea, Checkbox, CheckboxGroup, Cancel, Submit,
         Body, Section, Group, Field, Footer } from '~/components/form';

import withAuthorization from '~/auth/with-authorization';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import { scheduler } from '~/auth/permissions';
import { requireUser } from '~/auth/auth.server';
import { setFlashMessage, storage } from '~/utility/flash.server';
import { Level } from '~/components/toast';

const ENTITIES = [ "security-group", "provider", "client", "legal-entity" ];

export const handle = {
  name: "add-milestone",
  breadcrumb: ({ milestoneSet, current, name }: { milestoneSet: any } & BreadcrumbProps) => 
    <Breadcrumb to={`/milestones/${milestoneSet.id}/add`} name={name} current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const u = await requireUser(request);

  const { id } = params;

  if (id === undefined) return badRequest('Invalid data');

  const service = MilestoneService(u);
  const milestoneSet = await service.getMilestoneSetById({ id });
  const milestones = await service.listMilestonesBySet({ setId: id });

  return json({ milestoneSet, milestones });
};

const validator = withZod(zfd.formData({
  identifier: z
    .string()
    .nonempty("Milestone identifier is required"),
  description: z
    .string()
    .optional(),
  target: z
    .coerce.boolean(),
  interval: z
    .coerce.number()
    .min(0),
  entities: z
    .any()
    .transform(o =>
      ENTITIES
      .map(entity => o[entity] === "on" ? entity : undefined)
      .reduce((entities: string[], entity) => entity === undefined ? entities : [ ...entities, entity ], [])
    )
  }));

export const action = async ({ request, params }: ActionArgs) => {
  const u = await requireUser(request);

  const { id } = params;

  if (id === undefined) return badRequest('Invalid data');

  const formData = await request.formData()

  const result = await validator.validate(formData);

  if (result.error) return json({ ...validationError(result.error) });

  const { data: { description = null, ...data }} = result;
  const ms = await MilestoneService(u).addMilestone(create({ description, setId: id, index: 0, ...data }));

  const message = `Milestone Added:Milestone ${ms.identifier} successfully added.`;
  const level = Level.Success;
  const session = await setFlashMessage({ request, message, level });

  return redirect(`/milestones/${id}/edit`, {
    headers: { "Set-Cookie": await storage.commitSession(session) }
  });
};

const Add = () => {
  const { t } = useTranslation();

  const entities = ENTITIES.map(value => ({
    value, label: t(value), checked: true
  }));

  return (
    <>
      <Form method="post" validator={validator} id="add-milestone" className="mt-6">
        <Body>
          <Section heading='New Milestone' explanation='Please enter the new milestone details.' />
          <Group>
            <Field>
              <Input label="Identifier" name="identifier" placeholder="e.g. pay-date" />
            </Field>
            <Field>
              <TextArea label="Description" name="description" placeholder="e.g. Pay Date" rows={2} />
            </Field>
            {/* <Field>
              <Input label="Deadline" name="time" />
            </Field> */}
          </Group>
          <Section size="md" heading='Target Milestone' explanation='One milestone should be marked as the target, which determines where the first date should be calculated when schedules are generated.' />
          <Group>
            <Field>
              <Checkbox label="Target?" name="target" />
            </Field>
          </Group>
          <Section size="md" heading='Preceding Interval' explanation='Select how many days precede this milestone. The first milestone will always have an interval of zero days.' />
          <Group>
            <Field span={3}>
              <Input label="Interval in Days" name="interval" placeholder="0" width="44" />
            </Field>
          </Group>
          <Section size="md" heading='Entities' explanation='Specify which entities this milestone applies to.' />
          <Group>
            <Field>
              <CheckboxGroup name="entities" items={entities} />
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