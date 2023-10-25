import { useRef, useState, ReactNode, useEffect, Fragment } from 'react';
import { type ActionArgs, type LoaderArgs, redirect, json } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react'
import { Form, validationError, withZod, zfd, z } from '~/components/form';
import { useTranslation } from 'react-i18next';
import AddressConfigurator from '@recipher/i18n-postal-address';

import { badRequest } from '~/utility/errors';

import PersonService, { type Person, Classifier } from '~/services/manage/people.server';
import AddressService, { create } from '~/services/manage/addresses.server';
import CountryService, { type Country } from '~/services/countries.server';
import { AddressFields, AddressClassifiers } from '~/services/manage/common';

import { requireUser } from '~/auth/auth.server';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import withAuthorization from '~/auth/with-authorization';
import { manage } from '~/auth/permissions';
import { flag } from '~/components/countries/flag';

import { Input, Select, Cancel, Submit,
  Body, Section, Group, Field, Footer } from '~/components/form';

const toKebab = (str: string) => 
  str.replace(/([a-z0-9])([A-Z0-9])/g, '$1-$2').toLowerCase();

export const handle = {
  i18n: 'address',
  name: 'add-address',
  breadcrumb: ({ person, classifier, current, name }: { person: Person, classifier: Classifier } & BreadcrumbProps) => 
    <Breadcrumb to={`/manage/people/${classifier}/${person?.id}/addresses/add`} name={name} current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id, classifier } = params;

  if (id === undefined || classifier === undefined) return badRequest('Invalid request');

  const u = await requireUser(request);

  const person = await PersonService(u).getPerson({ id });
  const { countries } = await CountryService().listCountries({ limit: 300 });

  return json({ person, countries, classifier });
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
    republic: z.string().optional(),
    do: z.string().optional(),
    dong: z.string().optional(),
    gu: z.string().optional(),
    si: z.string().optional(),
    postalCode: z.string().optional(),
    prefecture: z.object({ name: z.string() }).optional().or(z.string().optional()),
    province: z.object({ name: z.string() }).optional().or(z.string().optional()),
    region: z.object({ name: z.string() }).optional().or(z.string().optional()),
    state: z.object({ name: z.string() }).optional().or(z.string().optional()),
    companyName: z.string().optional(),
    classifier: z.object({ id: z.string() }),
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

  const { data: { 
    country: { id: countryIsoCode, name: country }, 
    classifier: { id: addressClassifier }, ...data }} = result;
  
  type FieldKey = keyof typeof data;
  const getRegion = (field: FieldKey) => 
    typeof data[field] === "string" ? data[field] : (data[field] as { name: string })?.name;

  const state = getRegion('state'), province = getRegion('province'),
        prefecture = getRegion('prefecture'), region = getRegion('region');

  const service = AddressService(u);
  await service.addAddress(create({ country, countryIsoCode,
    classifier: addressClassifier, entityId: id, entity: classifier, 
    ...data, state, prefecture, province, region }));
  
  return redirect('../addresses');
};

const Add = () => {
  const { t } = useTranslation("address");
  const fetcher = useFetcher();
  const { person, countries } = useLoaderData();

  const countryData = countries.map((country: Country) => ({
    id: country.isoCode, name: country.name, 
    image: flag(country.isoCode)
  }));

  const [ addressConfig, setAddressConfig ] = useState<Array<Array<string>>>();
  const [ country, setCountry ] = useState(countryData.find((c: any) => c.id === person.locality ));
  const [ classifier, setClassifier ] = useState(AddressClassifiers.at(0) as string);
  const [ regionData, setRegionData ] = useState<Array<{ id: string, name: string }> | undefined>();

  const state = (country: string | undefined) => {
    if (country === 'GB') return t('county');
    return t('state');
  };

  const postalCode = (country: string | undefined) => {
    if (country === undefined) return t('postal-code');

    const map = new Map<string, string>([
      [ 'US', t('zipcode') ],
      [ 'NL', t('postcode') ],
      [ 'GB', t('postcode') ],
      [ 'PH', t('zipcode') ],
      [ 'IR', t('eircode') ],
      [ 'IT', t('cap') ],
      [ 'BR', t('cep') ],
      [ 'IN', t('pin') ],
      [ 'DE', t('plz') ],
      [ 'CH', t('plz') ],
      [ 'AT', t('plz') ],
      [ 'LI', t('plz') ],
      [ 'SK', t('psc') ],
      [ 'CZ', t('psc') ],
      [ 'MD', t('postal-index') ],
      [ 'UA', t('postal-index') ],
      [ 'BY', t('postal-index') ],
    ]);
    return map.get(country) || t('postal-code');
  };

  const Region = ({ field }: { field: string }) => {
    return regionData && regionData?.length
      ? <Select label={state(country?.id)} name={field} data={regionData} /> 
      : <Input label={state(country?.id)} name={field} />;
  };

  const FormConfig = (country: any | undefined) => ({ 
    fields: new Map<string, ReactNode>([
      [ "province", <Region field="province" /> ],
      [ "prefecture", <Region field="prefecture" /> ],
      [ "state", <Region field="state" /> ],
      [ "region", <Region field="region" /> ],
      [ "postalCode", <Input label={postalCode(country?.id)} name="postalCode" /> ],
    ]),
    spans: new Map<string, number>([
      [ "address1", 5 ],
      [ "address2", 5 ],
      [ "addressNum", 2 ],
      [ "postalCode", 2 ],
    ]),
  });  
  
  const changeAddressFormat = ({ country, classifier }: any) => {
    const address = new AddressConfigurator();

    AddressFields.forEach((field: string) => {
      if (field === 'companyName' && classifier !== 'business') return;
      address.setProperty(field, field);
    });
    // @ts-ignore
    address.setFormat({ country: country.id, type: classifier, useTransforms: false });
    setAddressConfig(address.toArray());
  };

  useEffect(() => {
    changeAddressFormat({ country, classifier });
  }, [ classifier ]);

  useEffect(() => {
    if (fetcher.state === 'idle') fetcher.load(`/countries/${country.id}/regions`);
    changeAddressFormat({ country, classifier });
  }, [ country ]);

  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data?.regions)
      setRegionData(fetcher.data.regions.map(({ isoCode: id, name }: Country) => ({ id, name })))
  }, [ fetcher.data ]);

  const classifierData = AddressClassifiers.map((id: string) => ({ id, name: t(id) }));

  return (
    <>
      <Form method="POST" validator={validator} id="add-address" encType="multipart/form-data" className="mt-6">
        <Body>
          <Section heading='New Address' explanation='Please select a country and then enter the new address.' />
          <Group>
            <Field span={3}>
              <Select onChange={({ id }: any) => setClassifier(id)}
                label='Select Address Type'
                name="classifier" 
                data={classifierData} 
                defaultValue={classifierData.at(0)} />
            </Field>
            <Field span={3}>
              <Select onChange={(country: any) => setCountry(country)}
                label='Select Country'
                name="country" 
                data={countryData} defaultValue={country} />
            </Field>
          </Group>
          {addressConfig?.map((properties: Array<string>, index) => {
            const { fields, spans } = FormConfig(country);
            return (
              <Fragment key={index}>
                <Section />
                <Group cols={6}>
                  {properties.map((property: string) => {
                    if (property === 'country') return null;
                    const input = fields.get(property),
                          span = spans.get(property);
                    return (
                      <Field key={property} span={span || 3}>
                        {input || <Input label={t(toKebab(property))} name={property} />}
                      </Field>
                    )})}
                </Group>
              </Fragment>
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