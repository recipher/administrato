import { type ActionArgs, type LoaderArgs, redirect, json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react'
import { validationError, z } from '~/components/form';

import { badRequest } from '~/utility/errors';

import PersonService from '~/services/manage/people.server';
import BankingService, { create } from '~/services/manage/banking.server';
import CountryService from '~/services/countries.server';
import { getBankingConfig } from '~/services/manage/banking';

import { requireUser } from '~/auth/auth.server';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import withAuthorization from '~/auth/with-authorization';
import { manage } from '~/auth/permissions';

import { BankAccountForm, getValidator } from '~/components/manage/bank-account-form';

export const handle = {
  i18n: 'banking',
  name: 'add-bank-account',
  path: 'add',
  breadcrumb: (props: BreadcrumbProps) => <Breadcrumb {...props} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id, classifier, account: accountId } = params;

  if (id === undefined || classifier === undefined || accountId === undefined) 
    return badRequest('Invalid request');

  const u = await requireUser(request);

  const person = await PersonService(u).getPerson({ id });
  const { countries } = await CountryService().listCountries({ limit: 300 });

  const bankAccount = await BankingService(u).getBankAccount({ id: accountId });

  return json({ bankAccount, person, countries, classifier });
};

export const action = async ({ request, params }: ActionArgs) => {
  const u = await requireUser(request);

  const { id, classifier, account: accountId } = params;
  if (id === undefined || classifier === undefined || accountId === undefined) 
    return badRequest('Invalid request');

  const validator = getValidator(z);
  const formData = await request.formData();
  
  const result = await validator.validate(formData);
  if (result.error) return validationError(result.error);
  
  const { data: { 
    country: { id: countryIsoCode }, 
    classifier: { id: accountClassifier }, ...data }} = result;
  
  await BankingService(u).updateBankAccount({ id: accountId, entityId: id, entity: classifier,
    classifier: accountClassifier, countryIsoCode, ...data });

  return redirect('../');
};

const Edit = () => {
  const { bankAccount, person, countries } = useLoaderData();

  return <BankAccountForm bankAccount={bankAccount} isoCode={person.locality} countries={countries} 
            permission={manage.edit.person} 
            heading="Edit Bank Account" 
            subHeading="Please select a country and then enter bank account details." />;
};

export default withAuthorization(manage.edit.person)(Edit);