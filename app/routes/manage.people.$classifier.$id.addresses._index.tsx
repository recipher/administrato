import { json, type LoaderArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

import PersonService, { type Person, Classifier } from '~/services/manage/people.server';
import AddressService, { Address } from '~/services/manage/addresses.server';

import { requireUser } from '~/auth/auth.server';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";

import { notFound, badRequest } from '~/utility/errors';
import { List, ListItem, ListContext } from '~/components/list';
import Alert, { Level } from '~/components/alert';
import { Layout, Heading } from '~/components/info/info';

export const handle = {
  i18n: "addresses",
  name: "addresses",
  breadcrumb: ({ person, classifier, current, name }: { person: Person, classifier: Classifier } & BreadcrumbProps) => 
    <Breadcrumb to={`/manage/people/${classifier}/${person?.id}/addresses`} name={name} current={current} />
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
  const { person, addresses } = useLoaderData();

  const Item = (address: Address) => <ListItem data={address.address} className="font-normal" />;
  const Context = (address: Address) => <ListContext select={false} />;

  return (
    <>
      <Layout>
        <Heading heading={t('addresses')} explanation={`Manage ${person.firstName}'s addresses.`} />
        {addresses.length === 0 && <Alert title="No addresses" level={Level.Info} /> }
        <List data={addresses} renderItem={Item} renderContext={Context} noNavigate={true} />
      </Layout>
    </>
  );
};

export default Addresses;
