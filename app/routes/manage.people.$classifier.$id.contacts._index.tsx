import { json, redirect, type LoaderArgs } from '@remix-run/node';
import { useLoaderData, useSubmit } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

import PersonService from '~/services/manage/people.server';
import ContactService, { type Contact } from '~/services/manage/contacts.server';
import { ContactClassifier } from '~/services/manage';

import { requireUser } from '~/auth/auth.server';
import { setFlashMessage, storage } from '~/utility/flash.server';

import { notFound, badRequest } from '~/utility/errors';
import { List, ListItem } from '~/components/list';
import Alert, { Level } from '~/components/alert';
import { Layout, Heading } from '~/components/info/info';

import { manage } from '~/auth/permissions';

export const handle = {
  i18n: "contacts",
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


export const action = async ({ request, params }: LoaderArgs) => {
  const u = await requireUser(request);

  const { id, classifier } = params;
  if (id === undefined || classifier === undefined) return badRequest('Invalid request');

  let message = "", level = Level.Success;
  const { intent, ...data } = await request.json();

  if (intent === "remove-contact") {
    const { contact } = data;

    try {
      await ContactService(u).deleteContact({ id: contact.id });
      message = `Contact Removed:The ${contact.classifier} has been removed.`;
    } catch(e: any) {
      message = `Remove Contact Error:${e.message}`;
      level = Level.Error;
    }
  }
  
  const session = await setFlashMessage({ request, message, level });
  return redirect(".", { headers: { "Set-Cookie": await storage.commitSession(session) } });
};

const ContactLink = ({ contact }: { contact: Contact }) => {
  const { value, classifier, sub } = contact;
  
  const href = {
    [ContactClassifier.Email]: `mailto:${value}`,
    [ContactClassifier.Phone]: `tel:${value}`,
    [ContactClassifier.Web]: `http://${value}`,
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
  const submit = useSubmit();
  const { person, contacts } = useLoaderData();

  const Item = (contact: Contact) => <ListItem data={<ContactLink contact={contact} />} sub={`${t(contact.sub || '')} ${t(contact.classifier)}`} className="font-medium" />;

  const actions = [
    { name: "remove", confirm: (contact: Contact) => `Remove this ${t(contact.classifier)}`, 
      permission: manage.edit.person,
      onClick: (contact: Contact) => {
        submit({ intent: "remove-contact", contact: { id: contact.id, classifier: t(contact.classifier).toLowerCase() }}, 
          { encType: "application/json", method: "POST" }) 
    }},
  ];

  return (
    <>
      <Layout>
        <Heading heading={t('contacts')} explanation={`Manage ${person.firstName}'s contact information.`} />
        {contacts.length === 0 && <Alert title="No contacts" level={Level.Info} /> }
        <List data={contacts} renderItem={Item} actions={actions} />
      </Layout>
    </>
  );
};

export default Contacts;
