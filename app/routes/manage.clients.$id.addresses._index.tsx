import { json, type LoaderArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

import ClientService, { type Client } from '~/services/manage/clients.server';
import AddressService, { Address } from '~/services/manage/addresses.server';

import { requireUser } from '~/auth/auth.server';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";

import { notFound, badRequest } from '~/utility/errors';
import { Cards, CardItem } from '~/components/list';
import Alert, { Level } from '~/components/alert';
import { Layout, Heading } from '~/components/info/info';

export const handle = {
  i18n: "addresses",
  name: "addresses",
  breadcrumb: ({ client, current, name }: { client: Client } & BreadcrumbProps) => 
    <Breadcrumb to={`/manage/legal-entities/${client?.id}/addresses`} name={name} current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id, classifier } = params;

  if (id === undefined) return badRequest('Invalid request');

  const u = await requireUser(request);

  const service = ClientService(u);
  const client = await service.getClient({ id });
  if (client === undefined) return notFound('Client not found');
    
  const addressesService = AddressService(u);
  const addresses = await addressesService.listAddressesByEntityId({ entityId: id });

  return json({ client, classifier, addresses });
};

const Addresses = () => {
  const { t } = useTranslation();
  const { t: ta } = useTranslation("address");
  const { client, addresses } = useLoaderData();

  const Address = ({ address } : { address: string | undefined }) =>
    <>{address?.split('\n').map((line: string, index) => <div key={index}>{line}</div>)}</>

  const Item = (address: Address) => <CardItem data={ta(address.classifier as string)} sub={<Address address={address.address} />} className="font-normal" />;

  return (
    <>
      <Layout>
        <Heading heading={t('addresses')} explanation={`Manage ${client.name}'s addresses.`} />
        {addresses.length === 0 && <Alert title="No addresses" level={Level.Info} /> }
        <Cards data={addresses} renderItem={Item} noNavigate={true} />
      </Layout>
    </>
  );
};

export default Addresses;
