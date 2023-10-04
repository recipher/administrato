import { useRef, useState } from 'react';
import { type ActionArgs, redirect, json, type UploadHandler,
  unstable_composeUploadHandlers as composeUploadHandlers,
  unstable_createMemoryUploadHandler as createMemoryUploadHandler,
  unstable_parseMultipartFormData as parseMultipartFormData } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react'
import { ValidatedForm as Form, validationError } from 'remix-validated-form';
import { withZod } from '@remix-validated-form/with-zod';
import { zfd } from 'zod-form-data';
import { z } from 'zod';

import { UserCircleIcon } from "@heroicons/react/24/solid";

import { createSupabaseUploadHandler } from '~/models/supabase.server';

import PersonService, { create } from '~/models/manage/people.server';
import { type Client } from '~/models/manage/clients.server';
import CountryService, { type Country } from '~/models/countries.server';

import { requireUser } from '~/auth/auth.server';

import { flag } from '~/components/countries/flag';
import { RefSelectorModal, SelectorModal } from '~/components/manage/selector';
import { Breadcrumb } from "~/layout/breadcrumbs";
import withAuthorization from '~/auth/with-authorization';
import { manage } from '~/auth/permissions';

import { Input, Select, Cancel, Submit, Image,
  Body, Section, Group, Field, Footer, Lookup } from '~/components/form';
import { IdentificationIcon } from '@heroicons/react/24/outline';

export const handle = {
  breadcrumb: ({ current }: { current: boolean }) => 
    <Breadcrumb to='/manage/contractors/add' name="add-contractor" current={current} />
};

export const loader = async ({ request }: ActionArgs) => {
  const service = CountryService();
  const { countries } = await service.listCountries({ limit: 300 });

  return json({ countries });
};

z.setErrorMap((issue, ctx) => {
  if (issue.code === "invalid_type") {
    if (issue.path.includes("locality"))
      return { message: "Country is required" };
  }
  return { message: ctx.defaultError };
});

const schema = zfd.formData({
  firstName: z
    .string()
    .nonempty("First name is required"),
  lastName: z
    .string()
    .nonempty("Last name is required"),
  clientId: z
    .string()
    .nonempty("The client is required"),
  locality: z
    .object({
      id: z.string()
    }),
  photo: z.any()
});

const validator = withZod(schema);

export const action = async ({ request }: ActionArgs) => {
  const u = await requireUser(request);

  const uploadHandler: UploadHandler = composeUploadHandlers(
    createSupabaseUploadHandler({ bucket: "images" }),
    createMemoryUploadHandler()
  );

  const formData = await parseMultipartFormData(request, uploadHandler);

  const result = await validator.validate(formData);
  if (result.error) return validationError(result.error);

  const { data: { locality: { id: isoCode }, ...data }} = result;
  
  const service = PersonService(u);
  const worker = await service.addContractor(create({ locality: isoCode, identifier: "", ...data }));
  
  return redirect(`/manage/workers/${worker.id}/info`);
};

const Add = () => {
  const { countries } = useLoaderData();

  const [ client, setClient ] = useState<Client>();
  
  const clientModal = useRef<RefSelectorModal>(null);

  const withFlag = countries.map((country: Country) => ({
    id: country.isoCode, name: country.name, 
    image: flag(country.isoCode)
  }));

  const showClientModal = () => clientModal.current?.show('client');

  return (
    <>
      <Form method="post" validator={validator} id="add-contractor" encType="multipart/form-data">
        <Body>
          <Section heading='New Contractor' explanation='Please enter the new contractor details.' />
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
          <Section size="md" heading="Select Client" explanation="Contractors need to be associated to a client." />
          <Group>
            <Field span={3}>
              <Lookup label="Client" name="clientId" onClick={showClientModal} 
                icon={IdentificationIcon} value={client} placeholder="Select a Client" />
            </Field>
          </Group>
          <Section heading='Specify Country' explanation='Enter the country where the contractor resides.' size="md" />
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
    </>
  );
}

export default withAuthorization(manage.create.worker)(Add);