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
import { AddressFields, BankAccountClassifiers } from '~/services/manage';

import { requireUser } from '~/auth/auth.server';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import withAuthorization from '~/auth/with-authorization';
import { manage } from '~/auth/permissions';
import { flag } from '~/components/countries/flag';

import { Input, Select, Cancel, Submit,
  Body, Section, Group, Field, Footer } from '~/components/form';

export const handle = {
  i18n: 'address',
  name: 'add-address',
  path: 'add',
  breadcrumb: (props: BreadcrumbProps) => <Breadcrumb {...props} />
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
  
  return redirect('../bank-accounts');
};

const Add = () => {
  const { t } = useTranslation("banking");
  const { person, countries } = useLoaderData();

  const [ classifier, setClassifier ] = useState(BankAccountClassifiers.at(0) as string);

  const countryData = countries.map((country: Country) => ({
    id: country.isoCode, name: country.name, 
    image: flag(country.isoCode)
  }));

  const [ country, setCountry ] = useState(countryData.find((c: any) => c.id === person.locality ));

  const classifierData = BankAccountClassifiers.map((id: string) => ({ id, name: t(id) }));

  return (
    <>
      <Form method="POST" validator={validator} id="add-bank-account" encType="multipart/form-data" className="mt-6">
        <Body>
          <Section heading='New Bank Account' explanation='Please select a country and then enter bank account details.' />
          <Group>
            <Field span={3}>
              <Select onChange={({ id }: any) => setClassifier(id)}
                label='Select Account Type'
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
        </Body>
        <Footer>
          <Cancel />
          <Submit text="Save" submitting="Saving..." permission={manage.edit.person} />
        </Footer>
      </Form>
    </>
  );
};

export default withAuthorization(manage.edit.person)(Add);