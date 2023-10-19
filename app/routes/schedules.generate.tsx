import { json, type LoaderArgs, type ActionArgs, redirect } from '@remix-run/node';
import { useLoaderData, useSubmit } from '@remix-run/react';

import { requireUser } from '~/auth/auth.server';

import ScheduleService from '~/services/scheduler/schedules.server';

import SecurityGroupService, { type SecurityGroup } from '~/services/manage/security-groups.server';
import ClientService, { type Client } from '~/services/manage/clients.server';
import LegalEntityService, { type LegalEntity } from '~/services/manage/legal-entities.server';
import ProviderService, { type Provider } from '~/services/manage/providers.server';


import { Breadcrumb, BreadcrumbProps } from '~/layout/breadcrumbs';

import ConfirmModal, { RefConfirmModal } from "~/components/modals/confirm";
import { SelectorModal, RefSelectorModal, entities } from '~/components/manage/selector';

import ButtonGroup, { type ButtonGroupButton } from '~/components/button-group';

import { Cancel, Submit,
  Body, Section, Group, Field, Footer,
  DatePicker, Form, withZod, zfd, z } from '~/components/form';

import { scheduler } from '~/auth/permissions';
import toNumber from '~/helpers/to-number';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from '~/hooks';

export const handle = {
  name: "generate-schedules",
  breadcrumb: ({ legalEntity, current, name }: { legalEntity: any } & BreadcrumbProps) => 
    <Breadcrumb to={`/schedules/${legalEntity?.id}/generate`} name={name} current={current} />
};


type Schedulable = (LegalEntity | Client | Provider | SecurityGroup);
type SchedulableWithType = Schedulable & { type: string, Icon?: any };

const toSchedulables = (type: string, schedulables: Array<Schedulable>) => {
  return schedulables.map(auth => ({ ...auth, type, Icon: entities.get(type).Icon }));
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
  const u = await requireUser(request);
  const formData = await request.formData();

  if (formData.get('intent') === 'add-schedulable') {
    const entity = formData.get('entity'), keyStart = formData.get('keyStart');
    console.log(entity, keyStart);
    return null;
  }

  if (formData.get('intent') === 'remove-schedulable') {
    const entity = formData.get('entity'), keyStart = formData.get('keyStart');
    console.log(entity, keyStart);
    return null;
  }

  const result = await validator.validate(formData);
  
  if (result.error) return null;

  return redirect(`/schedules/legal-entities`);
};

export default function Provider() {
  const u = useUser();
  const { t } = useTranslation();
  const { year } = useLoaderData();
  const modal = useRef<RefSelectorModal>(null);
  const submit = useSubmit();
  const [ entity, setEntity ] = useState<SchedulableWithType>();

  const confirm = useRef<RefConfirmModal>(null);

  const handleRemove = (entity: SchedulableWithType) => {
    setEntity(entity);
    confirm.current?.show(
      "Remove?", 
      "Yes, Remove", "Cancel", 
      `Are you sure you want to remove ${entity.name} from schedule generation?`);
  };

  const hasPermission = (p: string) => u.permissions.includes(p);

  const onConfirmRemove = () => {
    if (entity === undefined) return;
    submit({ intent: "remove-schedulable", 
             keyStart: entity.keyStart, keyEnd: entity.keyEnd, 
             entity: entity.name, type: entity.type }, 
           { method: "POST", encType: "multipart/form-data" });
  };

  const handleAdd = (entity: SchedulableWithType, type: string) => {
    submit({ intent: "add-schedulable", 
             keyStart: entity.keyStart, keyEnd: entity.keyEnd, 
             entity: entity.name, type: entity.type }, 
           { method: "POST", encType: "multipart/form-data" });
  };

  const showModal = (entity: string) => modal.current?.show(entity);

  const schedulableEntities: Array<ButtonGroupButton> = Array.from(entities.keys()).map(key => (
    { title: key, onClick: () => showModal(key), Icon: entities.get(key).Icon }
  ));

  return (
    <>
      <Form validator={validator} id="generate" method="POST" className="mt-6">
        <Body>
          <Section heading='Generate Schedules in Batch' 
            explanation='Please select start and end dates to schedule. 
              Take note, this will generate draft schedules, and will not 
              overwrite any existing schedules.' />
          <Group>
            <Field span={3}>
              <DatePicker label="Start" name="start" value={new Date(year, 0, 1)} />
            </Field>
            <Field span={3}>
              <DatePicker label="End" name="end" value={new Date(year, 11, 31)} />
            </Field>
          </Group>
          <Section size='md' heading="Select Legal Entities to Schedule"
            explanation="Select individual legal entities or one or more
              security groups to generate schedules for all the legal entities in
              those groups." />
          <Group>
            <Field>
              {hasPermission(scheduler.create.schedule) && 
                <ButtonGroup title="Select for Schedule Generation"
                  buttons={schedulableEntities} />}
            </Field>
          </Group>
        </Body>
        <Footer>
          <Cancel />
          <Submit text="Generate" submitting="Generating..." permission={scheduler.create.schedule} />
        </Footer>
      </Form>
      <SelectorModal ref={modal} onSelect={handleAdd} />
      <ConfirmModal ref={confirm} onYes={onConfirmRemove} />
    </>
  );
};