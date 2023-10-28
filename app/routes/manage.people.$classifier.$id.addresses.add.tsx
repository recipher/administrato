import { type ActionArgs, type LoaderArgs, redirect, json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react'
import { validationError, z } from '~/components/form';

import { badRequest } from '~/utility/errors';

import PersonService, { type Person, Classifier } from '~/services/manage/people.server';
import AddressService, { create } from '~/services/manage/addresses.server';
import CountryService from '~/services/countries.server';

import { requireUser } from '~/auth/auth.server';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import withAuthorization from '~/auth/with-authorization';
import { manage } from '~/auth/permissions';

import { AddressForm, getValidator } from '~/components/manage/address-form';

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

export const action = async ({ request, params }: ActionArgs) => {
  const u = await requireUser(request);

  const { id, classifier } = params;
  if (id === undefined || classifier === undefined) return badRequest('Invalid data');

  const validator = getValidator(z);
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
  const data = useLoaderData();
  return <AddressForm {...data} isoCode={data.person.locality} heading="New Address" permission={manage.edit.person}
    subHeading="Please select a country and then enter the new address."  />;
};

export default withAuthorization(manage.edit.person)(Add);