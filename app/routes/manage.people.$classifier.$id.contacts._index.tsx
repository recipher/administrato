import { json, type LoaderArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

import PersonService, { type Person, Classifier } from '~/services/manage/people.server';
import ContactService, { Contact } from '~/services/manage/contacts.server';
import { ContactClassifier } from '~/services/manage';

import { requireUser } from '~/auth/auth.server';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";

import { notFound, badRequest } from '~/utility/errors';
import { List, ListItem, ListContext } from '~/components/list';
import Alert, { Level } from '~/components/alert';
import { Layout, Heading } from '~/components/info/info';
import { nullable } from 'zod';

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

const ContactLink = ({ contact }: { contact: Contact }) => {
  const { value, classifier, sub } = contact;
  
  const href = {
    [ContactClassifier.Email]: `mailto:${value}`,
    [ContactClassifier.Phone]: `tel:${value}`,
    [ContactClassifier.Web]: value,
    [ContactClassifier.Social]: {
      "twitter": `https://twitter.com/${value}`,
      "facebook": `https://facebook.com/${value}`,
      "instagram": `https://instagram.com/${value}`,
      "whatsapp": `https://wa.me/${value}`,
      "snapchat": `https://snapchat.com/add/${value}`,
      "linkedin": `https://linkedin.com/in/${value}`,
    }[sub as string],
  }[classifier as ContactClassifier];

  const handleClick = (e: any) => e.stopPropagation();

  return <a href={href} target="_blank" onClick={handleClick}>{value}</a>;
};

const Contacts = () => {
  const { t } = useTranslation("contacts");
  const { person, contacts } = useLoaderData();

  const Item = (contact: Contact) => <ListItem data={<ContactLink contact={contact} />} sub={t(contact.classifier)} className="font-medium" />;
  const Context = (contact: Contact) => <ListContext data={t(contact.sub || "")} select={false} />;

  const name = `${person.firstName} ${person.lastName}`;

  return (
    <>
      <Layout>
        <Heading heading={t('contacts')} explanation={`Manage ${name}'s contact information.`} />
        {contacts.length === 0 && <Alert title="No contacts" level={Level.Info} /> }
        <List data={contacts} renderItem={Item} renderContext={Context} noNavigate={true} />
      </Layout>
    </>
  );
};


export default Contacts;
