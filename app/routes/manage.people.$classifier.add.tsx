import { useRef, useState } from 'react';
import { type ActionArgs, type LoaderArgs, redirect, json, type UploadHandler,
  unstable_composeUploadHandlers as composeUploadHandlers,
  unstable_createMemoryUploadHandler as createMemoryUploadHandler,
  unstable_parseMultipartFormData as parseMultipartFormData } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react'
import { ValidatedForm as Form, validationError } from 'remix-validated-form';
import { useTranslation } from 'react-i18next';
import { withZod } from '@remix-validated-form/with-zod';
import { zfd } from 'zod-form-data';
import { z } from 'zod';

import { UserCircleIcon } from "@heroicons/react/24/solid";

import { createSupabaseUploadHandler } from '~/models/supabase.server';
import { badRequest } from '~/utility/errors';

import PersonService, { create, Classifier } from '~/models/manage/people.server';
import { type Client } from '~/models/manage/clients.server';
import { type LegalEntity } from '~/models/manage/legal-entities.server';
import CountryService, { type Country } from '~/models/countries.server';

import { requireUser } from '~/auth/auth.server';

import { RefSelectorModal, SelectorModal } from '~/components/manage/selector';
import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import withAuthorization from '~/auth/with-authorization';
import { manage } from '~/auth/permissions';
import { flag } from '~/components/countries/flag';

import { Input, Select, Cancel, Submit, Image,
  Body, Section, Group, Field, Footer, Lookup } from '~/components/form';
import { IdentificationIcon, WalletIcon } from '@heroicons/react/24/outline';

import { configs, type Config } from './manage.people';

export const handle = {
  name: ({ classifier }: { classifier: Classifier }) => `add-${classifier}`,
  breadcrumb: ({ classifier, current, name }: { classifier: Classifier } & BreadcrumbProps) => 
    <Breadcrumb to={`/manage/people/${classifier}/add`} name={name} current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { classifier } = params;

  if (classifier === undefined) return badRequest('Invalid data');

  const config = configs.get(classifier);

  const service = CountryService();
  const { countries } = await service.listCountries({ limit: 300 });

  return json({ countries, classifier, config });
};

z.setErrorMap((issue, ctx) => {
  if (issue.code === "invalid_type") {
    if (issue.path.includes("locality"))
      return { message: "Country is required" };
  }
  return { message: ctx.defaultError };
});

const validator = (config: Config) => {
  let schema: any = {
    firstName: z
      .string()
      .nonempty("First name is required"),
    lastName: z
      .string()
      .nonempty("Last name is required"),
    locality: z
      .object({
        id: z.string()
      }),
    photo: z.any()
  };

  if (config.client) schema = { ...schema, 
    clientId: z.string().nonempty("The client is required")
  };

  if (config.legalEntity) schema = { ...schema, 
    legalEntityId: z.string().nonempty("The legal entity is required")
  };

  return withZod(zfd.formData(schema));
};

export const action = async ({ request, params }: ActionArgs) => {
  const u = await requireUser(request);

  const { classifier } = params;
  if (classifier === undefined) return badRequest('Invalid data');

  const config = configs.get(classifier);
  if (config === undefined) return badRequest('Invalid data');

  const uploadHandler: UploadHandler = composeUploadHandlers(
    createSupabaseUploadHandler({ bucket: "images" }),
    createMemoryUploadHandler()
  );

  const formData = await parseMultipartFormData(request, uploadHandler);
  
  const result = await validator(config).validate(formData);
  if (result.error) return validationError(result.error);

  const { data: { locality: { id: isoCode }, ...data }} = result;
  
  const service = PersonService(u);
  const person = await service.addPerson(create({ locality: isoCode, identifier: "", classifier, ...data }));
  
  return redirect(`/manage/people/${classifier}/${person.id}/info`);
};

const Add = () => {
  const { t } = useTranslation();
  const { countries, classifier, config } = useLoaderData();

  const [ client, setClient ] = useState<Client>();
  const [ legalEntity, setLegalEntity ] = useState<LegalEntity>();
  
  const clientModal = useRef<RefSelectorModal>(null);
  const legalEntityModal = useRef<RefSelectorModal>(null);

  const withFlag = countries.map((country: Country) => ({
    id: country.isoCode, name: country.name, 
    image: flag(country.isoCode)
  }));

  const showClientModal = () => clientModal.current?.show('client');
  const showLegalEntityModal = () => legalEntityModal.current?.show('legal-entity');

  return (
    <>
      <Form method="post" validator={validator(config)} id="add-person" encType="multipart/form-data">
        <Body>
          <Section heading={`New ${t(classifier)}`} explanation={`Please enter the new ${classifier} details.`} />
          <Group>
            <Field span={3}>
              <Input label="First Name" name="firstName" />
            </Field>
            <Field span={3}>
              <Input label="Last Name" name="lastName" />
            </Field>
            <Field>
              <Image label="Upload Photo" name="photo" accept="image/*" Icon={UserCircleIcon} />
            </Field>
          </Group>
          <Section size="md" heading={config.heading} explanation={config.explanation} />
          <Group>
            {config.client &&<Field span={3}>
              <Lookup label="Client" name="clientId" onClick={showClientModal} 
                icon={IdentificationIcon} value={client} placeholder="Select a Client" />
            </Field>}
            {config.legalEntity &&<Field span={3}>
              <Lookup label="Legal Entity" name="legalEntityId" onClick={showLegalEntityModal} 
                icon={WalletIcon} value={legalEntity} placeholder="Select a Legal Entity" />
            </Field>}
          </Group>
          <Section heading='Specify Country' explanation='Enter the country where the worker resides.' size="md" />
          <Group>
            <Field span={3}>
              <Select 
                label='Select Country'
                name="locality" 
                data={withFlag} />
            </Field>
          </Group>
        </Body>
        <Footer>
          <Cancel />
          <Submit text="Save" submitting="Saving..." permission={manage.create.worker} />
        </Footer>
      </Form>
      <SelectorModal ref={clientModal} onSelect={setClient} allowChange={false} />
      <SelectorModal ref={legalEntityModal} onSelect={setLegalEntity} allowChange={false} />
    </>
  );
}

export default withAuthorization(manage.create.worker)(Add);