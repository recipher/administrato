import { json, type LoaderArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

import PersonService, { type Person, Classifier } from '~/services/manage/people.server';
import ContactService, { Contact } from '~/services/manage/contacts.server';

import { requireUser } from '~/auth/auth.server';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";

import { notFound, badRequest } from '~/utility/errors';
import { List, ListItem, ListContext } from '~/components/list';
import Alert, { Level } from '~/components/alert';
import { Layout, Heading } from '~/components/info/info';

export const handle = {
  i18n: "contacts",
  name: "contacts",
  breadcrumb: ({ person, classifier, current, name }: { person: Person, classifier: Classifier } & BreadcrumbProps) => 
    <Breadcrumb to={`/manage/people/${classifier}/${person?.id}/contacts`} name={name} current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id, classifier } = params;

  if (id === undefined || classifier === undefined) return badRequest('Invalid request');

  const u = await requireUser(request);

  const service = PersonService(u);
  const person = await service.getPerson({ id });
  if (person === undefined) return notFound('Person not found');
    
  const contactService = ContactService(u);
  const contacts = await contactService.listContactsByEntityId({ entityId: id });

  return json({ person, classifier, contacts });
};

const Contacts = () => {
  const { t } = useTranslation();
  const { person, contacts } = useLoaderData();

  const Item = (contact: Contact) => <ListItem data={contact.value} />;
  const Context = (contact: Contact) => <ListContext />;

  const name = `${person.firstName} ${person.lastName}`;

  return (
    <>
      <Layout>
        <Heading heading={t('contacts')} explanation={`Manage ${name}'s contact information.`} />
        {contacts.length === 0 && <Alert title="No contacts" level={Level.Info} /> }
        <List data={contacts} renderItem={Item} renderContext={Context} />
      </Layout>
    </>
  );
};


export default Contacts;
