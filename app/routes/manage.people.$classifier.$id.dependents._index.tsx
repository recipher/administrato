import { json, redirect, type LoaderArgs } from '@remix-run/node';
import { useLoaderData, useSubmit } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

import PersonService from '~/services/manage/people.server';
import DependentService, { type Dependent } from '~/services/manage/dependents.server';
import { ContactClassifier } from '~/services/manage';

import { requireUser } from '~/auth/auth.server';
import { setFlashMessage, storage } from '~/utility/flash.server';

import { notFound, badRequest } from '~/utility/errors';
import { List, ListItem } from '~/components/list';
import Alert, { Level } from '~/components/alert';
import { Layout, Heading } from '~/components/info/info';

import { manage } from '~/auth/permissions';

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id, classifier } = params;

  if (id === undefined || classifier === undefined) return badRequest('Invalid request');

  const u = await requireUser(request);

  const service = PersonService(u);
  const person = await service.getPerson({ id });
  if (person === undefined) return notFound('Person not found');
    
  const dependentService = DependentService(u);
  const dependents = await dependentService.listDependentsByPersonId({ personId: id });

  return json({ person, classifier, dependents });
};

export const action = async ({ request, params }: LoaderArgs) => {
  // const u = await requireUser(request);

  // const { id, classifier } = params;
  // if (id === undefined || classifier === undefined) return badRequest('Invalid request');

  // let message = "", level = Level.Success;
  // const { intent, ...data } = await request.json();

  // if (intent === "remove-contact") {
  //   const { contact } = data;

  //   try {
  //     await ContactService(u).deleteContact({ id: contact.id });
  //     message = `Contact Removed:The ${contact.classifier} has been removed.`;
  //   } catch(e: any) {
  //     message = `Remove Contact Error:${e.message}`;
  //     level = Level.Error;
  //   }
  // }
  
  // const session = await setFlashMessage({ request, message, level });
  // return redirect(".", { headers: { "Set-Cookie": await storage.commitSession(session) } });
};

const Dependents = () => {
  const { t } = useTranslation("contacts");
  const submit = useSubmit();
  const { person, dependents } = useLoaderData<typeof loader>();

  const Item = (dependent: Dependent) => <ListItem data={dependent.relationship} className="font-medium" />;

  const actions = [
    { name: "remove", confirm: (dependent: Dependent) => `Remove this dependent`, 
      permission: manage.edit.person,
      onClick: (dependent: Dependent) => {
        submit({ intent: "remove-dependent", dependent: { id: dependent.id }}, 
          { encType: "application/json", method: "POST" }) 
    }},
  ];

  return (
    <>
      <Layout>
        <Heading heading={t('dependents')} explanation={`Manage ${person.firstName}'s dependents.`} />
        {dependents.length === 0 && <Alert title="No dependents" level={Level.Info} /> }
        <List data={dependents} renderItem={Item} actions={actions} />
      </Layout>
    </>
  );
};

export default Dependents;
