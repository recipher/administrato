import { useRef, useState, ReactNode } from 'react';
import { type ActionArgs, type LoaderArgs, redirect, json, type UploadHandler,
  unstable_composeUploadHandlers as composeUploadHandlers,
  unstable_createMemoryUploadHandler as createMemoryUploadHandler,
  unstable_parseMultipartFormData as parseMultipartFormData } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react'
import { Form, validationError, withZod, zfd, z, Combo } from '~/components/form';
import { useTranslation } from 'react-i18next';
import AddressConfigurator from 'i18n-postal-address';

import { createSupabaseUploadHandler } from '~/services/supabase.server';
import { badRequest } from '~/utility/errors';

import PersonService, { create, Classifier } from '~/services/manage/people.server';
import { type Client } from '~/services/manage/clients.server';
import { type LegalEntity } from '~/services/manage/legal-entities.server';
import CountryService, { type Country } from '~/services/countries.server';

import { requireUser } from '~/auth/auth.server';

import { RefSelectorModal, SelectorModal } from '~/components/manage/selector';
import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import withAuthorization from '~/auth/with-authorization';
import { manage } from '~/auth/permissions';
import { flag } from '~/components/countries/flag';

import { Input, Select, type SelectItem, Cancel, Submit, Image,
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
    if (issue.path.includes("country"))
      return { message: "Country is required" };
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
    country: z
      .object({ id: z.string()}),
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
    clientId, legalEntityId, ...data }} = result;
  
  const service = PersonService(u);
  const person = await service.addPerson(
    create({ nationality, locality, honorific, identifier: "", classifier, ...data }), 
    { clientId, legalEntityId });
  
  return redirect(`/manage/people/${classifier}/${person.id}/info`);
};

const honorifics = [ "Mr", "Mrs", "Ms", "Miss", "Dr" ];
const addresses = new Map<string, ReactNode>([
  [ "address1", <Input label="Address Line 1" name="address1" /> ],
  [ "address2", <Input label="Address Line 2" name="address2" /> ],
  [ "addressNum", <Input label="Number" name="addressNum" /> ],
  [ "city", <Input label="City" name="city" /> ],
  [ "country", <Input label="Country" name="country" /> ],
  [ "region", <Input label="Region" name="region" /> ],
  [ "republic", <Input label="Republic" name="republic" /> ],
  [ "province", <Input label="Province" name="province" /> ],
  [ "prefecture", <Input label="Prefecture" name="prefecture" /> ],
  [ "state", <Input label="State" name="state" /> ],
  [ "postalCode", <Input label="Postal Code" name="postalCode" /> ],
]);

const spans = new Map<string, number>([
  [ "address1", 3 ],
  [ "address2", 3 ],
  [ "city", 3 ],
  [ "region", 2 ],
  [ "province", 2 ],
  [ "state", 2 ],
  [ "prefecture", 2 ],
  [ "postalCode", 2 ],
]);

const Add = () => {
  const { t } = useTranslation();
  const { countries, config } = useLoaderData();

  const [ addressConfig, setAddressConfig ] = useState<Array<Array<string>>>();

  const withFlag = countries.map((country: Country) => ({
    id: country.isoCode, name: country.name, 
    image: flag(country.isoCode)
  }));

  const handleChangeCountry = (country: any) => {
    const address = new AddressConfigurator();
    address
      .setAddress1("address1")
      .setAddress2("address2")
      .setCity("city")
      .setRegion("region")
      .setProvince("province")
      .setPrefecture("prefecture")
      .setPostalCode("postalCode")
      .setState("state")
      .setRepublic("republic")
      .setFormat({ country: country.id, useTransforms: false });

    setAddressConfig(address.toArray());
  };

  return (
    <>
      <Form method="post" validator={validator(config)} id="add-address" encType="multipart/form-data" className="mt-6">
        <Body>
          <Section heading='New Address' explanation='Please enter the new address details.' />
          <Group>
            <Field span={3}>
              <Select onChange={handleChangeCountry}
                label='Select Country'
                name="country" 
                data={withFlag} />
            </Field>
          </Group>
          {addressConfig?.map((properties: Array<string>) => {
            return (
              <>
                <Section />
                <Group cols={6}>
                  {properties.map((property: string) => {
                    const input = addresses.get(property);
                    const span = spans.get(property);
                    return (
                    <Field span={span || 3}>
                      {input}
                    </Field>
                  )})}
                </Group>
              </>
            )})}
        </Body>
        <Footer>
          <Cancel />
          <Submit text="Save" submitting="Saving..." permission={manage.edit.person} />
        </Footer>
      </Form>
    </>
  );
}

export default withAuthorization(manage.edit.person)(Add);