import { useEffect, useRef, useState, FormEvent } from 'react';
import { type ActionArgs, redirect, json } from '@remix-run/node';
import { useActionData, useLoaderData, useSubmit } from '@remix-run/react'
import { ValidatedForm as Form, useFormContext, validationError } from 'remix-validated-form';
import { withZod } from '@remix-validated-form/with-zod';
import { zfd } from 'zod-form-data';
import { z } from 'zod';

import WorkerService from '~/models/manage/workers.server';
import { type Client } from '~/models/manage/clients.server';
import { type LegalEntity } from '~/models/manage/legal-entities.server';
import CountryService, { type Country } from '~/models/countries.server';

import { requireUser } from '~/auth/auth.server';

import { RefSelectorModal, SelectorModal } from '~/components/manage/selector';
import { Breadcrumb } from "~/layout/breadcrumbs";
import withAuthorization from '~/auth/with-authorization';
import { manage } from '~/auth/permissions';

import { Input, Select, Cancel, Submit, Hidden,
  Body, Section, Group, Field, Footer, Lookup } from '~/components/form';
import { IdentificationIcon, WalletIcon } from '@heroicons/react/24/outline';
import Button, { ButtonType } from '~/components/button';

export const handle = {
  breadcrumb: ({ current }: { current: boolean }) => 
    <Breadcrumb to='/manage/workers/add' name="add-worker" current={current} />
};

export const loader = async ({ request }: ActionArgs) => {
  const service = CountryService();
  const { countries } = await service.listCountries({ limit: 300 });

  return json({ countries });
};

const schema = zfd.formData({
  firstName: z
    .string()
    .nonempty("First name is required"),
    lastName: z
    .string()
    .nonempty("Last name is required"),
  legalEntityId: z
    .string(),
  clientId: z
    .string(),
  locality: z
    .object({
      id: z.string()
    })
});

const validator = withZod(schema);

export const action = async ({ request }: ActionArgs) => {
  const u = await requireUser(request);
  const formData = await request.formData()

  const result = await validator.validate(formData);
  if (result.error) return validationError(result.error);

  const { data: { locality: { id: isoCode }, ...data } } = result;
  
  const service = WorkerService(u);
  // @ts-ignore
  const worker = await service.addWorker({ locality: isoCode, identifier: "", ...data });
  
  return redirect('/manage/workers');
};

const Add = () => {
  const { countries } = useLoaderData();

  const [ client, setClient ] = useState<Client>();
  const [ legalEntity, setLegalEntity ] = useState<LegalEntity>();
  
  const clientModal = useRef<RefSelectorModal>(null);
  const legalEntityModal = useRef<RefSelectorModal>(null);

  const withFlag = countries.map((country: Country) => ({
    id: country.isoCode, name: country.name, 
    image: `https://cdn.ipregistry.co/flags/twemoji/${country.isoCode.toLowerCase()}.svg`
  }));

  const showClientModal = () => clientModal.current?.show('client');
  const showLegalEntityModal = () => legalEntityModal.current?.show('legal-entity');

  return (
    <>
      <Form method="post" validator={validator} id="add-worker">
        <Body>
          <Section heading='New Worker' explanation='Please enter the new worker details.' />
          <Group>
          <Field span={3}>
              <Input label="First Name" name="firstName" />
            </Field>
            <Field span={3}>
              <Input label="Last Name" name="lastName" />
            </Field>
          </Group>
          <Section heading='' explanation='' size="md" />
          <Group>
            <Field span={3}>
              <Lookup label="Client" name="clientId" onClick={showClientModal} 
                icon={IdentificationIcon} value={client} placeholder="Select a Client" />
            </Field>
            <Field span={3}>
              <Lookup label="Legal Entity" name="legalEntityId" onClick={showLegalEntityModal} 
                icon={WalletIcon} value={legalEntity} placeholder="Select a Legal Entity" />
            </Field>
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

export default withAuthorization(manage.create.serviceCentre)(Add);