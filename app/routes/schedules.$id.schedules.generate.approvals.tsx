import { json, type LoaderArgs, type ActionArgs, redirect } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import { badRequest, notFound } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';

import ScheduleService from '~/services/scheduler/schedules.server';
import LegalEntityService from '~/services/manage/legal-entities.server';
import { Breadcrumb, BreadcrumbProps } from '~/layout/breadcrumbs';

import { Cancel, Submit,
  Body, Section, Group, Field, Footer,
  Lookup, DatePicker, Form, withZod, zfd, z } from '~/components/form';

import { scheduler } from '~/auth/permissions';
import toNumber from '~/helpers/to-number';

export const handle = {
  name: "generate-schedules",
  breadcrumb: ({ legalEntity, current, name }: { legalEntity: any } & BreadcrumbProps) => 
    <Breadcrumb to={`/schedules/${legalEntity?.id}/generate`} name={name} current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest('Invalid request');

  const url = new URL(request.url);
  const year = toNumber(url.searchParams.get("year") as string) || new Date().getFullYear();

  const u = await requireUser(request);

  const service = LegalEntityService(u);
  const legalEntity = await service.getLegalEntity({ id });

  if (legalEntity === undefined) return notFound('Legal entity not found');

  return json({ legalEntity, year });
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
    legalEntityId: z
      .string()
  })
);

export const action = async ({ request, params }: ActionArgs) => {
  const url = new URL(request.url);
  const year = toNumber(url.searchParams.get("year") as string) || new Date().getFullYear();

  const u = await requireUser(request);
  const formData = await request.formData();
  const result = await validator.validate(formData);
  
  if (result.error) return;

  const service = ScheduleService(u);
  await service.generate(result.data);

  return redirect(`schedules?year=${year}`);
};

const noOp = () => null!

export default function Provider() {
  const { legalEntity: { logo, ...legalEntity }, year } = useLoaderData();

  return (
    <Form validator={validator} id="generate" method="POST" action={`/schedules/${legalEntity.id}?year=${year}`} className="mt-5">
      <Body>
        <Section heading='Select Approvers' 
          explanation={<><div>Are you sure you want to generate schedules for this legal entity?</div> 
            <div>Please select start and end dates. 
            Take note, this will generate a draft, and will not 
            overwrite any existing schedules.</div></>} />
        <Group>
          <Field>
            <Lookup label='Legal Entity' name="legalEntityId" onClick={noOp} 
              value={legalEntity} />
          </Field>
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