import { json, type LoaderArgs, type ActionArgs, redirect } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import { requireUser } from '~/auth/auth.server';

import ScheduleService from '~/services/scheduler/schedules.server';
import { Breadcrumb, BreadcrumbProps } from '~/layout/breadcrumbs';

import { Cancel, Submit,
  Body, Section, Group, Field, Footer,
  DatePicker, Form, withZod, zfd, z } from '~/components/form';

import { scheduler } from '~/auth/permissions';
import toNumber from '~/helpers/to-number';

export const handle = {
  name: "generate-schedules",
  breadcrumb: ({ legalEntity, current, name }: { legalEntity: any } & BreadcrumbProps) => 
    <Breadcrumb to={`/schedules/${legalEntity?.id}/generate`} name={name} current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const url = new URL(request.url);
  const year = toNumber(url.searchParams.get("year") as string) || new Date().getFullYear();

  return json({ year });
};

export const validator = withZod(
  zfd.formData({
    start: z
      .string()
      .nonempty('Start date is required')
      .transform((date: string) => new Date(date)),
    end: z
      .string()
      .nonempty('End date is required')
      .transform((date: string) => new Date(date)),
  })
);

export const action = async ({ request, params }: ActionArgs) => {
  const url = new URL(request.url);
  const year = toNumber(url.searchParams.get("year") as string) || new Date().getFullYear();

  const u = await requireUser(request);
  const formData = await request.formData();
  const result = await validator.validate(formData);
  
  if (result.error) return;

  return redirect(`/schedules/legal-entities?year=${year}`);
};

export default function Provider() {
  const { year } = useLoaderData();

  return (
    <Form validator={validator} id="generate" method="POST" className="mt-6">
      <Body>
        <Section heading='Generate Schedules' 
          explanation={<><div>Are you sure you want to generate schedules?</div> 
            <div>Please select start and end dates. 
            Take note, this will generate draft schedules, and will not 
            overwrite any existing schedules.</div></>} />
        <Group>
          <Field span={3}>
            <DatePicker label="Start" name="start" value={new Date(year, 0, 1)} />
          </Field>
          <Field span={3}>
            <DatePicker label="End" name="end" value={new Date(year, 11, 31)} />
          </Field>
        </Group>
      </Body>
      <Footer>
        <Cancel />
        <Submit text="Generate" submitting="Generating..." permission={scheduler.create.schedule} />
      </Footer>
    </Form>
  );
};