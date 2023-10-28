import { useRef, useState } from 'react';
import { json, type LoaderArgs, type ActionArgs, redirect } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

import { requireUser } from '~/auth/auth.server';
import { useUser } from '~/hooks';
import { setFlashMessage, storage } from '~/utility/flash.server';

import ScheduleService from '~/services/scheduler/schedules.server';

import { type SecurityGroup } from '~/services/manage/security-groups.server';
import { type Client } from '~/services/manage/clients.server';
import { type LegalEntity } from '~/services/manage/legal-entities.server';
import { type Provider } from '~/services/manage/providers.server';

import { Breadcrumb, BreadcrumbProps } from '~/layout/breadcrumbs';

import ConfirmModal, { RefConfirmModal } from "~/components/modals/confirm";
import { SelectorModal, RefSelectorModal, entities } from '~/components/manage/entity-selector';

import { Alert, Level } from '~/components';
import ButtonGroup, { type ButtonGroupButton } from '~/components/button-group';

import { Cancel, Submit, Hidden,
  Body, Section, Group, Field, Footer,
  DatePicker, Form, withZod, zfd, z, validationError } from '~/components/form';

import { scheduler } from '~/auth/permissions';
import toNumber from '~/helpers/to-number';

export const handle = {
  name: "generate-schedules",
  path: "generate",
  breadcrumb: (props: BreadcrumbProps) => <Breadcrumb {...props} />
};

type Schedulable = (LegalEntity | Client | Provider | SecurityGroup);
type SchedulableWithType = Schedulable & { type: string, Icon?: any };

export const loader = async ({ request }: LoaderArgs) => {
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
    schedulables: z
      .string(),
  })
);

export const action = async ({ request, params }: ActionArgs) => {
  const u = await requireUser(request);
  const formData = await request.formData();

  const result = await validator.validate(formData);
  
  if (result.error) return json({ ...validationError(result.error) });

  const { schedulables: schedulablesJson, start, end } = result.data;
  const schedulables = JSON.parse(schedulablesJson);

  let message, level = Level.Success, redirectTo = ".";
  if (schedulables.length === 0) {
    message = "Schedule Generation Error:Please select legal entities to schedule for generation.";
    level = Level.Error;
  } else {
    const service = ScheduleService(u);
    await service.requestGeneration({ start, end, schedulables });
  
    message = "Schedule Generation Requested:A request has been submitted to generate schedules.";
    redirectTo = "/schedules/legal-entities";
  }
  
  const session = await setFlashMessage({ request, message, level });
  return redirect(redirectTo, {
    headers: { "Set-Cookie": await storage.commitSession(session) }
  });
};

export default function Provider() {
  const u = useUser();
  const { t } = useTranslation();
  const { year } = useLoaderData();
  const modal = useRef<RefSelectorModal>(null);
  const [ entity, setEntity ] = useState<SchedulableWithType>();
  const [ schedulables, setSchedulables ] = useState<Array<SchedulableWithType>>([]);

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
    setSchedulables(() => schedulables.filter(s => s.id !== entity.id));
  };

  const handleAdd = (entity: SchedulableWithType, type: string) => {
    if (schedulables.find(s => s.id === entity.id)) return;
    setSchedulables(() => [ ...schedulables, { ...entity, type } ]);
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
            <Field span="full" className="-mt-4">
              {schedulables.length === 0 && <Alert title='No entities selected' level={Level.Warning} className="-mt-0" />}
              {schedulables.length > 0 && <ul role="list" className="text-md leading-6">
                {schedulables.map((schedulable: SchedulableWithType) => (
                  <li key={schedulable.id} className="group flex justify-between gap-x-6 py-2 cursor-pointer">
                    <div className="text-gray-900 pr-3">
                      {/* @ts-ignore */}
                      <span className="font-normal">{t(schedulable.type)} {schedulable.parentId ? t('group') : null}</span>
                      <span className="font-medium"> {schedulable.name}</span>
                    </div>
                      {hasPermission(scheduler.create.schedule) && <button onClick={() => handleRemove(schedulable)}
                        type="button" className="hidden group-hover:block font-medium text-red-600 hover:text-red-500">
                        {t('remove')}
                      </button>}
                  </li>
                ))}
              </ul>}
              <Hidden name="schedulables" value={JSON.stringify(schedulables)} />
            </Field>
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