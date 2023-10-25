import { useRef, useState, FormEvent, Fragment, useEffect } from 'react';
import { type ActionArgs, redirect, json, type LoaderArgs, type UploadHandler,
  unstable_composeUploadHandlers as composeUploadHandlers,
  unstable_createMemoryUploadHandler as createMemoryUploadHandler,
  unstable_parseMultipartFormData as parseMultipartFormData } from '@remix-run/node';
import { useActionData, useLoaderData } from '@remix-run/react'
import { useTranslation } from 'react-i18next';
import { Form, useFormContext, withZod, zfd, z, useFieldArray } from '~/components/form';

import { IdentificationIcon, MapIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

import { createSupabaseUploadHandler } from '~/services/supabase.server';

import LegalEntityService, { create } from '~/services/manage/legal-entities.server';
import { Frequency, Target, Weekday, toTarget } from '~/services/scheduler/schedules.server';

import SecurityGroupService, { type SecurityGroup } from '~/services/manage/security-groups.server';
import { type Provider } from '~/services/manage/providers.server';

import { requireUser } from '~/auth/auth.server';

import { Input, UniqueInput, Select, Cancel, Submit, Checkbox, Image,
         Body, Section, Group, Field, Footer, Lookup } from '~/components/form';
import { CountryFormManager, buildValidationError, changeCodes } from '~/components/countries/form';

import { RefSelectorModal, SelectorModal } from '~/components/manage/selector';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import withAuthorization from '~/auth/with-authorization';
import { manage } from '~/auth/permissions';

export const handle = {
  i18n: "schedule",
  name: "add-legal-entity",
  breadcrumb: ({ current, name }: BreadcrumbProps) => 
    <Breadcrumb to='/manage/legal-entities/add' name={name} current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const url = new URL(request.url);
  const id = url.searchParams.get("security-group");

  const u = await requireUser(request);

  const service = SecurityGroupService(u);
  const securityGroup = id ? await service.getSecurityGroup({ id }) : undefined;

  const frequencies = Object.values(Frequency).filter(item => isNaN(Number(item)));
  const targets = Object.values(Target).filter(item => isNaN(Number(item)));
  const weekdays = Object.values(Weekday).filter(item => isNaN(Number(item)));

  return json({ securityGroup, frequencies, targets, weekdays });
};

z.setErrorMap((issue, ctx) => {
  if (issue.code === "invalid_type") {
    if (issue.expected === "number")
      return { message: "Not a number" };
  }
  return { message: ctx.defaultError };
});

const idSchema = z.object({ id: z.string() });
const numberSchema = (min: number, max: number, message: string) => 
  z.coerce.number().min(min, message).max(max, message).optional();

const schema = 
  zfd.formData({
    name: z
      .string()
      .nonempty("Legal entity name is required")
      .min(3, "Legal entity name must be at least 3 characters long"),
    identifier: z
      .string()
      .optional(),
    localities: z
      .object({
        id: z.string().or(z.array(z.string()))
      }),
    securityGroupId: z
      .string()
      .nonempty("The security group is required"),
    providerId: z
      .string()
      .nonempty("The provider is required"),
    logo: z.any(),
    frequency: idSchema,
    targets: z
      .array(
        z.object({
          target: idSchema,
          day: idSchema.optional(),
          date: numberSchema(0, 31, "Date must be between 1 and 31"),
          offset: numberSchema(0, 30, "Offset must be between 0 and 30")
        })
      ),
  });

export const clientValidator = withZod(schema);

export const action = async ({ request }: ActionArgs) => {
  const u = await requireUser(request);

  const uploadHandler: UploadHandler = composeUploadHandlers(
    createSupabaseUploadHandler({ bucket: "images" }),
    createMemoryUploadHandler()
  );

  const formData = await parseMultipartFormData(request, uploadHandler);

  if (formData.get('intent') === 'change-codes') {
    return json(await changeCodes(String(formData.get('codes'))));
  }

  const validator = withZod(schema.superRefine(
    async (data, ctx) => {
      const service = LegalEntityService(u);
      if (data.identifier) {
        const legalEntity = await service.getLegalEntity({ id: data.identifier }, { bypassKeyCheck: true });
        if (legalEntity !== undefined) 
          ctx.addIssue({
            message: "This identifier is already in use",
            path: [ "identifier" ],
            code: z.ZodIssueCode.custom,
          });
      }
        if (data.name) {
          const legalEntity = await service.getLegalEntityByName({ name: data.name }, { bypassKeyCheck: true });
          if (legalEntity !== undefined) 
            ctx.addIssue({
              message: "This name is already in use",
              path: [ "name" ],
              code: z.ZodIssueCode.custom,
            });
        }
      }
  ));

  const result = await validator.validate(formData);
  if (result.error) { 
    return buildValidationError(result.error, result.submittedData.localities);
  }

  const { data: { 
    frequency: { id: frequency }, targets,
    localities: { id: codes }, identifier = "", ...data }} = result;
  const localities = Array.isArray(codes) === false ? [ codes ] as string[] : codes as string[];

  const target = toTarget(targets.map((t: any) => ({ target: t.target.id, day: t.day.id, offset: t.offset, date: t.date })));

  const service = LegalEntityService(u);
  const legalEntity = 
    await service.addLegalEntity(create({ localities, identifier, frequency, target, ...data }));
  
  return legalEntity
    ? redirect(`/manage/legal-entities/${legalEntity.id}/info`)
    : redirect(`/manage/legal-entities`);
};

const Add = () => {
  const data = useActionData();
  const { t } = useTranslation("schedule");
  const { frequencies, targets, weekdays, ...loaderData } = useLoaderData();

  const [ autoGenerateIdentifier, setAutoGenerateIdentifier ] = useState(true);
  const [ provider, setProvider ] = useState<Provider>();
  const [ securityGroup, setSecurityGroup ] = useState<SecurityGroup>(loaderData.securityGroup);

  const [ target, setTarget ] = useState<Array<string>>([ "last", "last", "last" ]);
  const [ items, { push, remove } ] = useFieldArray("targets", {
    formId: "add-legal-entity",
  });

  const context = useFormContext("add-legal-entity");

  const providerModal = useRef<RefSelectorModal>(null);
  const showProviderModal = () => providerModal.current?.show('provider');

  const securityGroupModal = useRef<RefSelectorModal>(null);
  const showSecurityGroupModal = () => securityGroupModal.current?.show('security-group');

  const handleAutoGenerate = (e: FormEvent<HTMLInputElement>) => {
    setAutoGenerateIdentifier(e.currentTarget.checked);
  };

  const handleChangeTarget = (t: { id: string }, index: number) => {
    target[index] = t.id;
    setTarget(() => [...target]);
  };

  const handleChangeFrequency = (frequency: { id: string }) => {
    const count = frequency.id === "semi-monthly" ? 2 : frequency.id === "tri-monthly" ? 3 : 1;

    if (count > items.length)
      for (let i = items.length; i < count; i++)
        push({ target: { id: "last" }});
    
    if (count < items.length)
      for (let i = items.length-1; i >= count; i--)
        remove(i);
  };

  const targetData = targets?.map((target: string) => ({ id: target, name: t(target, { ns: "schedule" }) }));
  const weekdayData = weekdays?.map((w: string) => ({ id: w, name: t(w, { ns: "schedule" }) }));
  const frequencyData = frequencies?.map((f: string) => ({ id: f, name: t(f, { ns: "schedule" }) }));

  const ordinal = (key: number) =>
    key === 0 ? "First" : key === 1 ? "Second" : key === 2 ? "Third" : "";
  const targetLabel = (key: number) => {
    const label = 'Target Due Day';
    if (items.length === 1) return label;
    return `${ordinal(key)} ${label}`;
  };

  return (
    <>
      <Form method="post" defaultValues={{ targets: [ { target: { id: "last" }}]}}
        validator={clientValidator} id="add-legal-entity" encType="multipart/form-data">
        <Body>
          <Section heading='New Legal Entity' explanation='Please enter the new legal entity details.' />
          <Group>
            <Field>
              <UniqueInput label="Legal Entity Name" name="name" placeholder="e.g. Recipher Scotland"
                checkUrl="/manage/legal-entities/name" property="legalEntity" message="This name is already in use" />
            </Field>
            <Field span={3}>
              <UniqueInput label="Identifier" name="identifier" 
                checkUrl="/manage/legal-entities" property="legalEntity" message="This identifier is already in use"
                disabled={autoGenerateIdentifier} placeholder="leave blank to auto-generate" />
            </Field>
            <Field span={3}>
              <div className="pt-9">
                <Checkbox label="Auto-generate?" name="auto" checked={autoGenerateIdentifier} onChange={handleAutoGenerate} />
              </div>
            </Field>
            <Field>
              <Image label="Upload Logo" name="logo" accept="image/*" Icon={GlobeAltIcon} />
            </Field>
          </Group>
          <Section size="md" />
          <Group>
            <Field span={3}>
              <Lookup label="Security Group" name="securityGroupId" onClick={showSecurityGroupModal} 
                icon={MapIcon} value={securityGroup} placeholder="Select a Security Group" />
            </Field>
            <Field span={3}>
              <Lookup label="Provider" name="providerId" onClick={showProviderModal} 
                icon={IdentificationIcon} value={provider} placeholder="Select a Provider" />
            </Field>
          </Group>
          <Section size="md" heading="Schedule Generate" explanation="Specify schedule generation rules." />
          <Group>
            <Field span={3}>
              <Select label="Schedule Frequency" name="frequency" defaultValue={frequencyData.at(0)}
                data={frequencyData} onChange={handleChangeFrequency} />
            </Field>
          </Group>
          {items.map(({ key }, index) => (
            <Fragment key={key}>
              <Section size="md" />
              <Group>
                <Field span={3}>
                  <Select label={targetLabel(index)} name={`targets[${index}].target`} onChange={(value: any) => handleChangeTarget(value, index)} 
                    data={targetData} defaultValue={targetData.at(0)} />
                </Field>
                <Field span={2} className={target[index] === "day" ? "" : "hidden"}>
                  <Select label="Weekday" name={`targets[${index}].day`} data={weekdayData} defaultValue={weekdayData.at(0)} />
                </Field>
                <Field span={1} className={target[index] === "date" || target[index] === "following" ? "" : "hidden"}>
                  <Input label="Date" name={`targets[${index}].date`}/>
                </Field>
                <Field span={1} className={target[index] === "last" ? "" : "hidden"}>
                  <Input label="Offset" name={`targets[${index}].offset`} />
                </Field>
              </Group>
            </Fragment>
          ))}
          <CountryFormManager context={context} data={data} />
        </Body>
        <Footer>
          <Cancel />
          <Submit text="Save" submitting="Saving..." permission={manage.create.legalEntity} />
        </Footer>
      </Form>
      <SelectorModal ref={providerModal} onSelect={setProvider} allowChange={false} />
      <SelectorModal ref={securityGroupModal} forAuthorization={false}
        onSelect={setSecurityGroup} allowChange={false} />
    </>
  );
}

export default withAuthorization(manage.create.legalEntity)(Add);