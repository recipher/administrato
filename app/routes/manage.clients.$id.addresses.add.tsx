import { type ActionArgs, type LoaderArgs, redirect, json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react'
import { validationError, z } from '~/components/form';

import { badRequest } from '~/utility/errors';

import ClientService, { type Client } from '~/services/manage/clients.server';
import AddressService, { type Address, create } from '~/services/manage/addresses.server';
import CountryService from '~/services/countries.server';

import { requireUser } from '~/auth/auth.server';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import withAuthorization from '~/auth/with-authorization';
import { manage } from '~/auth/permissions';

import { AddressForm, getValidator } from '~/components/manage/address-form';

export const handle = {
  i18n: 'address',
  name: 'add-address',
  breadcrumb: ({ client, current, name }: { client: Client } & BreadcrumbProps) => 
    <Breadcrumb to={`/manage/clients/${client?.id}/addresses/add`} name={name} current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest('Invalid request');

  const u = await requireUser(request);

  const client = await ClientService(u).getClient({ id });
  const { countries } = await CountryService().listCountries({ limit: 300 });

  return json({ client, countries });
};

export const action = async ({ request, params }: ActionArgs) => {
  const u = await requireUser(request);

  const { id } = params;
  if (id === undefined) return badRequest('Invalid data');

  const validator = getValidator(z);
  const formData = await request.formData();
  
  const result = await validator.validate(formData);
  if (result.error) return validationError(result.error);

  const { data: { 
    country: { id: countryIsoCode, name: country }, ...data }} = result;
  
  type FieldKey = keyof typeof data;
  const getRegion = (field: FieldKey) => 
    typeof data[field] === "string" ? data[field] : (data[field] as { name: string })?.name;

  const state = getRegion('state'), province = getRegion('province'),
        prefecture = getRegion('prefecture'), region = getRegion('region');

  const service = AddressService(u);
  await service.addAddress(create({ country, countryIsoCode,
    entityId: id, entity: 'client', ...data,
    classifier: 'business', state, prefecture, province, region }));
  
  return redirect('../addresses');
};

const Add = () => {
  const { client, countries } = useLoaderData();

  return <AddressForm isoCode={client.localities.at(0)} 
    countries={countries} selectClassifier={false}
    permission={manage.edit.client} heading="New Address" subHeading="Please select a country and then enter the new address." />;
};

export default withAuthorization(manage.edit.client)(Add);