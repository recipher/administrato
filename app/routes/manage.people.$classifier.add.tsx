import { useRef, useState, ReactNode } from 'react';
import { type ActionArgs, type LoaderArgs, redirect, json, type UploadHandler,
  unstable_composeUploadHandlers as composeUploadHandlers,
  unstable_createMemoryUploadHandler as createMemoryUploadHandler,
  unstable_parseMultipartFormData as parseMultipartFormData } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react'
import { Form, validationError, withZod, zfd, z } from '~/components/form';
import { useTranslation } from 'react-i18next';
import NameConfigurator from '@recipher/i18n-postal-address';

import { createSupabaseUploadHandler } from '~/services/supabase.server';
import { badRequest } from '~/utility/errors';

import PersonService, { create, Classifier, type Person } from '~/services/manage/people.server';
import { type Client } from '~/services/manage/clients.server';
import { type LegalEntity } from '~/services/manage/legal-entities.server';
import CountryService, { type Country } from '~/services/countries.server';
import { NameFields, Honorifics } from '~/services/manage';

import { requireUser } from '~/auth/auth.server';

import { RefSelectorModal as RefEntitySelectorModal, 
  SelectorModal as EntitySelectorModal } from '~/components/manage/entity-selector';
import { RefSelectorModal as RefPersonSelectorModal, 
  SelectorModal as PersonSelectorModal } from '~/components/manage/person-selector';
import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import withAuthorization from '~/auth/with-authorization';
import { manage } from '~/auth/permissions';
import { flag } from '~/components/countries/flag';

import { Input, Select, type SelectItem, Cancel, Submit,
  Body, Section, Group, Field, Footer, Lookup } from '~/components/form';
import { IdentificationIcon, UserCircleIcon, WalletIcon } from '@heroicons/react/24/outline';

import { configs, type Config } from './manage.people';

const toKebab = (str: string) => 
  str.replace(/([a-z0-9])([A-Z0-9])/g, '$1-$2').toLowerCase();

export const handle = {
  i18n: 'address',
  name: ({ classifier }: { classifier: Classifier }) => `add-${classifier}`,
  breadcrumb: ({ classifier, current, name }: { classifier: Classifier } & BreadcrumbProps) => 
    <Breadcrumb to={`/manage/people/${classifier}/add`} name={name} current={current} />
};

export const loader = async ({ params }: LoaderArgs) => {
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
    if (issue.path.includes("nationality"))
      return { message: "Nationality is required" };
  }
  return { message: ctx.defaultError };
});

const validator = (config: Config) => {
  let schema: any = {
    firstName: z
      .string()
      .nonempty("First name is required"),
    secondName: z.string().optional(),
    firstLastName: z.string().optional(),
    secondLastName: z.string().optional(),
    lastName: z.string().optional(),
    honorific: z
      .object({ id: z.string()})
      .optional(),
    nationality: z
      .object({ id: z.string()}),
    locality: z
      .object({ id: z.string()}),
    photo: z.any(),
    supervisorId: z.string().optional()
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

  const { data: { locality: { id: locality }, nationality: { id: nationality },
    honorific: { id: honorific }, 
    clientId, legalEntityId, supervisorId, ...data }} = result;
  
  const service = PersonService(u);
  const person = await service.addPerson(
    create({ nationality, locality, honorific, identifier: "", classifier, ...data }), 
    { clientId, legalEntityId });
  
  return redirect(`/manage/people/${classifier}/${person.id}/info`);
};

const Add = () => {
  const { t } = useTranslation();
  const { t: tn } = useTranslation("address");
  const { countries, classifier, config } = useLoaderData();

  const [ supervisor, setSupervisor ] = useState<Person>();
  const [ client, setClient ] = useState<Client>();
  const [ locality, setLocality ] = useState<SelectItem>();
  const [ localityChanged, setLocalityChanged ] = useState<boolean>(false);
  const [ legalEntity, setLegalEntity ] = useState<LegalEntity>();
  const [ nameConfig, setNameConfig ] = useState<Array<Array<string>>>();

  const clientModal = useRef<RefEntitySelectorModal>(null);
  const legalEntityModal = useRef<RefEntitySelectorModal>(null);
  const supervisorModal = useRef<RefPersonSelectorModal>(null);

  const withFlag = countries.map((country: Country) => ({
    id: country.isoCode, name: country.name, 
    image: flag(country.isoCode)
  }));

  const names = new Map<string, ReactNode>([
    [ "honorific", <Select label={tn('honorific')} name="honorific" 
                      data={Honorifics.map(id => ({ id, name: id }))} /> ],
  ]);
  const spans = new Map<string, number>([
    [ "honorific", 2 ],
  ]);

  const showClientModal = () => clientModal.current?.show('client');
  const showLegalEntityModal = () => legalEntityModal.current?.show('legal-entity');
  const showSupervisorModal = () => supervisorModal.current?.show('employee');

  const handleChangeNationality = (nationality: any) => {
    if (localityChanged === false) setLocality(nationality);

    const name = new NameConfigurator();
    NameFields.forEach((key: string) => name.setProperty(key, key));
    name.setFormat({ country: nationality.id });
    setNameConfig(name.toArray());
  };

  return (
    <>
      <Form method="post" validator={validator(config)} id="add-person" encType="multipart/form-data">
        <Body>
          <Section heading={`New ${t(classifier)}`} explanation={`Please enter the new ${classifier} details.`} />
          <Group>
            <Field span={3}>
              <Select onChange={handleChangeNationality}
                label='Select Nationality'
                name="nationality" 
                data={withFlag} />
            </Field>
          </Group>
          {nameConfig?.map((properties: Array<string>) => {
            return (
              <>
                <Section />
                <Group cols={11}>
                  {properties.map((property: string) => {
                    const input = names.get(property),
                          span = spans.get(property);
                    return (
                      <Field span={span || 3}>
                        {input || <Input label={tn(toKebab(property))} name={property} />}
                      </Field>
                    )})}
                </Group>
              </>
            )})}
          <Section size="md" heading="Select Supervisor" explanation="" />
          <Group>
            <Field span={3}>
              <Lookup label="Supervisor" name="supervisorId" onClick={showSupervisorModal} 
                icon={UserCircleIcon} value={supervisor} placeholder="Select a Person" />
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
              <Select onChange={() => setLocalityChanged(true)}
                label='Select Country'
                name="locality" 
                data={withFlag} value={locality} />
            </Field>
          </Group>
        </Body>
        <Footer>
          <Cancel />
          <Submit text="Save" submitting="Saving..." permission={manage.create.person} />
        </Footer>
      </Form>
      <EntitySelectorModal ref={clientModal} onSelect={setClient} allowChange={false} />
      <EntitySelectorModal ref={legalEntityModal} onSelect={setLegalEntity} allowChange={false} />
      <PersonSelectorModal ref={supervisorModal} onSelect={setSupervisor} />
    </>
  );
}

export default withAuthorization(manage.create.person)(Add);