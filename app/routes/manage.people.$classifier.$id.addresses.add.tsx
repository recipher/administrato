import { useRef, useState, ReactNode } from 'react';
import { type ActionArgs, type LoaderArgs, redirect, json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react'
import { Form, validationError, withZod, zfd, z } from '~/components/form';
import { useTranslation } from 'react-i18next';
import AddressConfigurator from '@recipher/i18n-postal-address';

import { badRequest } from '~/utility/errors';

import { type Person, Classifier } from '~/services/manage/people.server';
import AddressService, { create } from '~/services/manage/addresses.server';
import CountryService, { type Country } from '~/services/countries.server';

import { requireUser } from '~/auth/auth.server';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import withAuthorization from '~/auth/with-authorization';
import { manage } from '~/auth/permissions';
import { flag } from '~/components/countries/flag';

import { Input, Select, Cancel, Submit,
  Body, Section, Group, Field, Footer } from '~/components/form';

import { type Config } from './manage.people';

export const handle = {
  name: 'add-address',
  breadcrumb: ({ person, classifier, current, name }: { person: Person, classifier: Classifier } & BreadcrumbProps) => 
    <Breadcrumb to={`/manage/people/${classifier}/${person?.id}/documents/add`} name={name} current={current} />
};

export const loader = async ({ params }: LoaderArgs) => {
  const { classifier } = params;

  if (classifier === undefined) return badRequest('Invalid data');

  const service = CountryService();
  const { countries } = await service.listCountries({ limit: 300 });

  return json({ countries, classifier });
};

z.setErrorMap((issue, ctx) => {
  if (issue.code === "invalid_type") {
    if (issue.path.includes("country"))
      return { message: "Country is required" };
  }
  return { message: ctx.defaultError };
});

const validator = withZod(
  zfd.formData({
    address1: z.string().optional(),
    address2: z.string().optional(),
    addressNum: z.string().optional(),
    city: z.string().optional(),
    region: z.string().optional(),
    state: z.string().optional(),
    republic: z.string().optional(),
    do: z.string().optional(),
    dong: z.string().optional(),
    gu: z.string().optional(),
    si: z.string().optional(),
    postalCode: z.string().optional(),
    prefecture: z.string().optional(),
    province: z.string().optional(),
    country: z.object({ id: z.string(), name: z.string() }),
  })
);

export const action = async ({ request, params }: ActionArgs) => {
  const u = await requireUser(request);

  const { id, classifier } = params;
  if (id === undefined || classifier === undefined) return badRequest('Invalid data');

  const formData = await request.formData();
  
  const result = await validator.validate(formData);
  if (result.error) return validationError(result.error);

  const { data: { country: { id: countryIsoCode, name: country }, ...data }} = result;
  
  const service = AddressService(u);
  await service.addAddress(create({ country, countryIsoCode, entityId: id, entity: classifier, ...data }));
  
  return redirect('../addresses');
};

const Add = () => {
  const { t } = useTranslation();
  const { countries } = useLoaderData();

  const [ addressConfig, setAddressConfig ] = useState<Array<Array<string>>>();
  const [ country, setCountry ] = useState();

  const state = (country: string | undefined) => {
    if (country === 'GB') return 'County';
    return 'State';
  };

  const postalCode = (country: string | undefined) => {
    if (country === undefined) return 'Postal code';

    const map = new Map<string, string>([
      [ 'US', 'ZIP Code' ],
      [ 'NL', 'Postcode' ],
      [ 'GB', 'Postcode' ],
      [ 'PH', 'ZIP Code' ],
      [ 'IR', 'Eircode' ],
      [ 'IT', 'CAP' ],
      [ 'BR', 'CEP' ],
      [ 'IN', 'PIN' ],
      [ 'DE', 'PLZ' ],
      [ 'CH', 'PLZ' ],
      [ 'AT', 'PLZ' ],
      [ 'LI', 'PLZ' ],
      [ 'SK', 'PSČ' ],
      [ 'CZ', 'PSČ' ],
      [ 'MD', 'Postal index' ],
      [ 'UA', 'Postal index' ],
      [ 'BY', 'Postal index' ],
    ]);
    return map.get(country) || 'Postal code';
  };

  const FormConfig = (country: string | undefined) => ({ 
    fields: new Map<string, ReactNode>([
      [ "address1", <Input label="Address Line 1" name="address1" /> ],
      [ "address2", <Input label="Address Line 2" name="address2" /> ],
      [ "addressNum", <Input label="Number" name="addressNum" /> ],
      [ "city", <Input label="City" name="city" /> ],
      [ "region", <Input label="Region" name="region" /> ],
      [ "republic", <Input label="Republic" name="republic" /> ],
      [ "province", <Input label="Province" name="province" /> ],
      [ "prefecture", <Input label="Prefecture" name="prefecture" /> ],
      [ "state", <Input label={state(country)} name="state" /> ],
      [ "postalCode", <Input label={postalCode(country)} name="postalCode" /> ],
      [ "si", <Input label="Si" name="si" /> ],
      [ "gu", <Input label="Gu" name="gu" /> ],
      [ "do", <Input label="Do" name="do" /> ],
      [ "dong", <Input label="Dong" name="dong" /> ],
    ]),
    spans: new Map<string, number>([
      [ "address1", 5 ],
      [ "address2", 5 ],
      [ "addressNum", 2 ],
      [ "postalCode", 2 ],
    ]),
  });  

  const withFlag = countries.map((country: Country) => ({
    id: country.isoCode, name: country.name, 
    image: flag(country.isoCode)
  }));

  const handleChangeCountry = ({ id: country }: any) => {
    const address = new AddressConfigurator();

    const config = FormConfig(country);

    Array.from(config.fields.keys()).forEach((key: string) => 
      address.setProperty(key, key));
      
    address.setFormat({ country, useTransforms: false });
    setAddressConfig(address.toArray());
    setCountry(country);
  };

  return (
    <>
      <Form method="POST" validator={validator} id="add-address" encType="multipart/form-data" className="mt-6">
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
            const { fields, spans } = FormConfig(country);
            return (
              <>
                <Section />
                <Group cols={6}>
                  {properties.map((property: string) => {
                    const input = fields.get(property);
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