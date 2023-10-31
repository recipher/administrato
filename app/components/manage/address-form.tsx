import { useState, ReactNode, useEffect, Fragment } from 'react';
import { useFetcher } from '@remix-run/react'
import { Form, withZod, zfd, z } from '~/components/form';
import { useTranslation } from 'react-i18next';
import AddressConfigurator from '@recipher/i18n-postal-address';

import { type Address } from '~/services/manage/addresses.server';
import { type Country } from '~/services/countries.server';
import { AddressFields, AddressClassifiers } from '~/services/manage';

import { flag } from '~/components/countries/flag';

import { Input, Select, Cancel, Submit,
  Body, Section, Group, Field, Footer } from '~/components/form';

const toKebab = (str: string) => 
  str.replace(/([a-z0-9])([A-Z0-9])/g, '$1-$2').toLowerCase();

export const getValidator = (z: any) => {
  z.setErrorMap((issue: any, ctx: any) => {
    if (issue.code === "invalid_type") {
      if (issue.path.includes("country"))
        return { message: "Country is required" };
    }
    return { message: ctx.defaultError };
  });

  return withZod(
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
      classifier: z.object({ id: z.string() }).optional(),
      country: z.object({ id: z.string(), name: z.string() }),
    })
  );
};

type Props = {
  isoCode: string;
  address?: Address | undefined;
  countries: Array<Country>;
  heading: string;
  subHeading: string;
  permission: string;
  selectClassifier?: boolean;
};

export const AddressForm = ({ isoCode, address, countries, heading, subHeading, permission, selectClassifier = true }: Props) => {
  const { t } = useTranslation("address");
  const fetcher = useFetcher();

  const countryData = countries.map((country: Country) => ({
    id: country.isoCode, name: country.name, 
    image: flag(country.isoCode)
  }));

  const [ addressConfig, setAddressConfig ] = useState<Array<Array<string>>>();
  const [ country, setCountry ] = useState(countryData.find((c: any) => c.id === isoCode ));
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

  const Region = ({ field, value }: { field: string, value: string | undefined | null }) => {
    return regionData && regionData?.length
      ? <Select label={state(country?.id)} name={field} data={regionData} defaultValue={regionData.find(r => r.name === value)} /> 
      : <Input label={state(country?.id)} name={field} value={value} />;
  };

  const FormConfig = (country: any | undefined) => ({ 
    fields: new Map<string, ReactNode>([
      [ "province", <Region field="province" value={address?.province} /> ],
      [ "prefecture", <Region field="prefecture" value={address?.prefecture} /> ],
      [ "state", <Region field="state" value={address?.state} /> ],
      [ "region", <Region field="region" value={address?.region} /> ],
      [ "postalCode", <Input label={postalCode(country?.id)} name="postalCode" value={address?.postalCode}  /> ],
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
    if (fetcher.state === 'idle') fetcher.load(`/countries/${country?.id}/regions`);
    changeAddressFormat({ country, classifier });
  }, [ country ]);

  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data?.regions)
      setRegionData(fetcher.data.regions.map(({ isoCode: id, name }: Country) => ({ id, name })))
  }, [ fetcher.data ]);

  const classifierData = AddressClassifiers.map((id: string) => ({ id, name: t(id) }));

  return (
    <>
      <Form method="POST" validator={getValidator(z)} id="save-address" encType="multipart/form-data" className="mt-6">
        <Body>
          <Section heading={heading} explanation={subHeading} />
          <Group>
            {selectClassifier && <Field span={3}>
              <Select onChange={({ id }: any) => setClassifier(id)}
                label='Select Address Type'
                name="classifier" 
                data={classifierData} 
                defaultValue={classifierData.find(c => c.id === address?.classifier)} />
            </Field>}
            <Field span={3}>
              <Select onChange={setCountry}
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
                        {input || <Input label={t(toKebab(property))} name={property} value={address?.[property as keyof typeof address] as string} />}
                      </Field>
                    )})}
                </Group>
              </Fragment>
            )})}
        </Body>
        <Footer>
          <Cancel />
          <Submit text="Save" submitting="Saving..." permission={permission} />
        </Footer>
      </Form>
    </>
  );
};