import { json, redirect, type LoaderArgs } from '@remix-run/node';
import { useLoaderData, useSubmit } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

import PersonService from '~/services/manage/people.server';
import BankingService, { type BankAccount } from '~/services/manage/banking.server';
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
    
  const bankingService = BankingService(u);
  const bankAccounts = await bankingService.listBankAccountsByEntityId({ entityId: id });

  return json({ person, classifier, bankAccounts });
};


export const action = async ({ request, params }: LoaderArgs) => {
  const u = await requireUser(request);

  const { id, classifier } = params;
  if (id === undefined || classifier === undefined) return badRequest('Invalid request');

  let message = "", level = Level.Success;
  const { intent, ...data } = await request.json();

  if (intent === "remove-bank-account") {
    const { account } = data;

    try {
      await BankingService(u).deleteBankAccount({ id: account.id });
      message = `Bank Account Removed:The bank account ${account.iban} has been removed.`;
    } catch(e: any) {
      message = `Remove Bank Account Error:${e.message}`;
      level = Level.Error;
    }
  }
  
  const session = await setFlashMessage({ request, message, level });
  return redirect(".", { headers: { "Set-Cookie": await storage.commitSession(session) } });
};

const BankAccounts = () => {
  const { t } = useTranslation();
  const submit = useSubmit();
  const { person, bankAccounts } = useLoaderData();

  const Item = (account: BankAccount) => <ListItem data={account.iban} className="font-medium" />;

  const actions = [
    { name: "remove", confirm: (account: BankAccount) => `Remove Bank Account ${account.iban}`, 
      permission: manage.edit.person,
      onClick: (account: BankAccount) => {
        submit({ intent: "remove-bank-account", account: { id: account.id, iban: account.iban }}, 
          { encType: "application/json", method: "POST" }) 
    }},
  ];

  return (
    <>
      <Layout>
        <Heading heading={t('banking')} explanation={`Manage ${person.firstName}'s bank accounts.`} />
        {bankAccounts.length === 0 && <Alert title="No bank accounts" level={Level.Info} /> }
        <List data={bankAccounts} renderItem={Item} actions={actions} />
      </Layout>
    </>
  );
};

export default BankAccounts;
