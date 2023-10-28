import { useRef, useState, ReactNode, useEffect, Fragment } from 'react';
import { type ActionArgs, type LoaderArgs, redirect, json } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react'
import { Form, validationError, withZod, zfd, z } from '~/components/form';
import { useTranslation } from 'react-i18next';
import AddressConfigurator from '@recipher/i18n-postal-address';

import { badRequest } from '~/utility/errors';

import PersonService, { type Person, Classifier } from '~/services/manage/people.server';
import BankingService, { create } from '~/services/manage/banking.server';
import CountryService, { type Country } from '~/services/countries.server';
import { BankAccountClassifiers } from '~/services/manage';
import { getBankingConfig, type BankingConfig } from '~/services/manage/banking';

import { requireUser } from '~/auth/auth.server';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import withAuthorization from '~/auth/with-authorization';
import { manage } from '~/auth/permissions';
import { flag } from '~/components/countries/flag';

import { Input, Select, Cancel, Submit,
  Body, Section, Group, Field, Footer } from '~/components/form';
import { type EventFor } from '~/helpers';

export const handle = {
  i18n: 'banking',
  name: 'add-bank-account',
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
    iban: z.string().min(1),
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
    country: { id: countryIsoCode }, 
    classifier: { id: accountClassifier }, ...data }} = result;

  const config = getBankingConfig(countryIsoCode);
  if (config === undefined) return null; // TEMP
   
  const iban = `${config?.country}${config?.iban.checkDigits}${data.iban}`;

  await BankingService(u).addBankAccount(create({ entityId: id, entity: classifier,
    classifier: accountClassifier, countryIsoCode, ...data, iban }));

  return redirect('../');
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
  const [ config, setConfig ] = useState<BankingConfig | undefined>();
  const [ iban, setIban ] = useState<string>();
  const [ ibanPrefix, setIbanPrefix ] = useState<string>();

  const classifierData = BankAccountClassifiers.map((id: string) => ({ id, name: t(id) }));

  const handleChangeCountry = (country: any) => {
    setCountry(country);
  };

  useEffect(() => {
    setConfig(getBankingConfig(country.id));
  }, [ country ]);


  useEffect(() => {
    const ibanConfig = config?.iban;
    setIbanPrefix(`${country.id}${ibanConfig?.checkDigits}`);
  }, [ config ]);

  const handleChangeBban = (e: EventFor<"input", "onChange">) => {
    const value = e.currentTarget.value;
    setIban(value);
  };

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
              <Select onChange={handleChangeCountry}
                label='Select Country'
                name="country" 
                data={countryData} defaultValue={country} />
            </Field>
          </Group>
          <Section size="md" />
          <Group>
            <Field>
              <Input name="bban" label="BBAN" onChange={handleChangeBban} />
            </Field>
            <Field>
              <Input name="iban" label="IBAN" pre={ibanPrefix} value={iban} />
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