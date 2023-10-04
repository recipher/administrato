import { useEffect, useRef, useState, FormEvent } from 'react';
import { type ActionArgs, redirect, json, type LoaderArgs, type UploadHandler,
  unstable_composeUploadHandlers as composeUploadHandlers,
  unstable_createMemoryUploadHandler as createMemoryUploadHandler,
  unstable_parseMultipartFormData as parseMultipartFormData } from '@remix-run/node';
import { useActionData, useLoaderData, useSubmit } from '@remix-run/react'
import { useTranslation } from 'react-i18next';
import { ValidatedForm as Form, useFormContext, validationError } from 'remix-validated-form';
import { withZod } from '@remix-validated-form/with-zod';
import { zfd } from 'zod-form-data';
import { z } from 'zod';

import { CameraIcon } from '@heroicons/react/24/solid';
import { IdentificationIcon, MagnifyingGlassIcon, MapIcon } from '@heroicons/react/24/outline';

import { createSupabaseUploadHandler } from '~/models/supabase.server';

import LegalEntityService, { create, frequencies } from '~/models/manage/legal-entities.server';
import ServiceCentreService, { type ServiceCentre } from '~/models/manage/service-centres.server';
import CountryService, { type Country } from '~/models/countries.server';
import { type Provider } from '~/models/manage/providers.server';

import { requireUser } from '~/auth/auth.server';

import { UniqueInput, Select, Cancel, Submit, Checkbox, Image,
         Body, Section, Group, Field, Footer, Lookup } from '~/components/form';
import { CountryFormManager, buildValidationError, changeCodes } from '~/components/countries/form';

import type { RefModal } from '~/components/modals/modal';
import { CountriesModal } from '~/components/countries/countries';
import { RefSelectorModal, SelectorModal } from '~/components/manage/selector';

import { Breadcrumb } from "~/layout/breadcrumbs";
import withAuthorization from '~/auth/with-authorization';
import { manage } from '~/auth/permissions';
import Button, { ButtonType } from '~/components/button';
import toNumber from '~/helpers/to-number';

export const handle = {
  i18n: "schedule",
  breadcrumb: ({ current }: { current: boolean }) => 
    <Breadcrumb to='/manage/legal-entities/add' name="add-legal-entity" current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const url = new URL(request.url);
  const id = url.searchParams.get("service-centre");

  const u = await requireUser(request);

  const service = ServiceCentreService(u);
  const serviceCentre = id ? await service.getServiceCentre({ id }) : undefined;

  return json({ serviceCentre, frequencies });
};

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
    serviceCentreId: z
      .string()
      .nonempty("The service centre is required"),
    providerId: z
      .string()
      .nonempty("The provider is required"),
    logo: z.any(),
  });

export const clientValidator = withZod(schema);

export const action = async ({ request }: ActionArgs) => {
  const countryService = CountryService();

  const u = await requireUser(request);

  const uploadHandler: UploadHandler = composeUploadHandlers(
    createSupabaseUploadHandler({ bucket: "images" }),
    createMemoryUploadHandler()
  );

  const formData = await parseMultipartFormData(request, uploadHandler);

  if (formData.get('intent') === 'change-codes') {
    return json(await changeCodes(formData));
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

  const { data: { localities: { id: codes }, identifier = "", ...data } } = result;
  const localities = Array.isArray(codes) === false ? [ codes ] as string[] : codes as string[];

  const service = LegalEntityService(u);
  const legalEntity = await service.addLegalEntity(create({ localities, identifier, ...data }));
  
  return legalEntity
    ? redirect(`/manage/legal-entities/${legalEntity.id}/info`)
    : redirect(`/manage/legal-entities`);
};

const Add = () => {
  const { t } = useTranslation();
  const { frequencies, ...loaderData } = useLoaderData();

  const [ autoGenerateIdentifier, setAutoGenerateIdentifier ] = useState(true);
  const [ provider, setProvider ] = useState<Provider>();
  const [ serviceCentre, setServiceCentre ] = useState<ServiceCentre>(loaderData.serviceCentre);

  const context = useFormContext("add-legal-entity");

  const providerModal = useRef<RefSelectorModal>(null);
  const showProviderModal = () => providerModal.current?.show('provider');

  const serviceCentreModal = useRef<RefSelectorModal>(null);
  const showServiceCentreModal = () => serviceCentreModal.current?.show('service-centre');

  const handleAutoGenerate = (e: FormEvent<HTMLInputElement>) => {
    setAutoGenerateIdentifier(e.currentTarget.checked);
  };

  return (
    <>
      <Form method="post" validator={clientValidator} id="add-legal-entity" encType="multipart/form-data">
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
              <Image label="Upload Logo" name="logo" accept="image/*" Icon={CameraIcon} />
            </Field>
            <Field span={3}>
              <Select label="Schedule Frequency" name="frequency" data={frequencies?.map((f: string) => ({ id: f, name: t(f, { ns: "schedule" }) }))} />
            </Field>
          </Group>
          <Section size="md" />
          <Group>
            <Field span={3}>
              <Lookup label="Service Centre" name="serviceCentreId" onClick={showServiceCentreModal} 
                icon={MapIcon} value={serviceCentre} placeholder="Select a Service Centre" />
            </Field>
            <Field span={3}>
              <Lookup label="Provider" name="providerId" onClick={showProviderModal} 
                icon={IdentificationIcon} value={provider} placeholder="Select a Provider" />
            </Field>
          </Group>
          <CountryFormManager context={context} />
        </Body>
        <Footer>
          <Cancel />
          <Submit text="Save" submitting="Saving..." permission={manage.create.legalEntity} />
        </Footer>
      </Form>
      <SelectorModal ref={providerModal} onSelect={setProvider} allowChange={false} />
      <SelectorModal ref={serviceCentreModal} forAuthorization={false}
        onSelect={setServiceCentre} allowChange={false} />
    </>
  );
}

export default withAuthorization(manage.create.legalEntity)(Add);