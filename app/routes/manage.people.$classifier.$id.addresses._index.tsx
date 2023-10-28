import { json, type LoaderArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

import PersonService, { type Person, Classifier } from '~/services/manage/people.server';
import AddressService, { Address } from '~/services/manage/addresses.server';

import { requireUser } from '~/auth/auth.server';

import { notFound, badRequest } from '~/utility/errors';
import { Cards, CardItem } from '~/components/list';
import Alert, { Level } from '~/components/alert';
import { Layout, Heading } from '~/components/info/info';

export const handle = {
  i18n: "addresses"
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id, classifier } = params;

  if (id === undefined || classifier === undefined) return badRequest('Invalid request');

  const u = await requireUser(request);

  const service = PersonService(u);
  const person = await service.getPerson({ id });
  if (person === undefined) return notFound('Person not found');
    
  const addressesService = AddressService(u);
  const addresses = await addressesService.listAddressesByEntityId({ entityId: id });

  return json({ person, classifier, addresses });
};

const Addresses = () => {
  const { t } = useTranslation();
  const { t: ta } = useTranslation("address");
  const { person, addresses } = useLoaderData();

  const Address = ({ address } : { address: string | undefined }) =>
    <>{address?.split('\n').map((line: string, index) => <div key={index}>{line}</div>)}</>

  const Item = (address: Address) => <CardItem data={ta(address.classifier as string)} sub={<Address address={address.address} />} className="font-normal" />;

  return (
    <>
      <Layout>
        <Heading heading={t('addresses')} explanation={`Manage ${person.firstName}'s addresses.`} />
        {addresses.length === 0 && <Alert title="No addresses" level={Level.Info} /> }
        <Cards data={addresses} renderItem={Item} />
      </Layout>
    </>
  );
};

export default Addresses;
