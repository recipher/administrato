import { type ActionArgs, type LoaderArgs, redirect, json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react'
import { validationError, z } from '~/components/form';

import { badRequest, notFound } from '~/utility/errors';

import PersonService, { type Person, Classifier } from '~/services/manage/people.server';
import AddressService, { type Address } from '~/services/manage/addresses.server';
import CountryService from '~/services/countries.server';

import { requireUser } from '~/auth/auth.server';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import withAuthorization from '~/auth/with-authorization';
import { manage } from '~/auth/permissions';

import { AddressForm, getValidator } from '~/components/manage/address-form';

export const handle = {
  i18n: 'address',
  name: ({ address }: { address: Address }) => address.address1,
  path: ({ address }: { address: Address }) => address.id,
  breadcrumb: (props: BreadcrumbProps) => <Breadcrumb {...props} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id, classifier, address: addressId } = params;

  if (id === undefined || classifier === undefined || addressId === undefined) 
    return badRequest('Invalid request');

  const u = await requireUser(request);

  const person = await PersonService(u).getPerson({ id });
  const { countries } = await CountryService().listCountries({ limit: 300 });

  const address = await AddressService(u).getAddress({ id: addressId });
  
  if (address === undefined) return notFound('Address not found');

  return json({ person, address, countries, classifier });
};

export const action = async ({ request, params }: ActionArgs) => {
  const u = await requireUser(request);

  const { id, classifier, address: addressId } = params;
  if (id === undefined || classifier === undefined || addressId === undefined) 
    return badRequest('Invalid data');

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
  await service.updateAddress({ id: addressId, country, countryIsoCode,
    classifier: addressClassifier, entityId: id, entity: classifier, 
    ...data, state, prefecture, province, region });
  
  return redirect('../addresses');
};

const Add = () => {
  const data = useLoaderData();
  return <AddressForm {...data} isoCode={data.address.countryIsoCode} 
    heading="Edit Address" subHeading="Edit address details." permission={manage.edit.person} />;
};

export default withAuthorization(manage.edit.person)(Add);