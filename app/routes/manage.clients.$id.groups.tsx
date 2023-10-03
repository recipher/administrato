import { json, type LoaderArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import { badRequest, notFound } from '~/utility/errors';

import ClientService, { Client } from '~/models/manage/clients.server';

import Alert, { Level } from '~/components/alert';
import { List, ListContext, ListItem } from '~/components/list';
import { requireUser } from '~/auth/auth.server';
import { Breadcrumb } from "~/layout/breadcrumbs";

import toNumber from '~/helpers/to-number';

export const handle = {
  breadcrumb: ({ client, current }: { client: any, current: boolean }) => 
    <Breadcrumb to={`/manage/clients/${client?.id}/groups`} name="groups" current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest('Invalid request');

  const u = await requireUser(request);

  const service = ClientService(u);
  const client = await service.getClient({ id });

  if (client === undefined) return notFound('Client not found');

  const groups = await service.listClients({ parentId: id });

  return json({ client, groups, clients: groups });
};

const Groups = () => {
  const { client, groups } = useLoaderData();
  
  const Item = (group: Client) => <ListItem data={group.name} />;
  const Context = (group: Client) => <ListContext select={true} />

  return (
    <>
      {groups.length === 0 && <Alert title="No client groups" level={Level.Info} />}
        <List data={groups} renderItem={Item} renderContext={Context} buildTo={({ item }) => `../../${item.id}`} />
    </>
  );
};

export default Groups;
