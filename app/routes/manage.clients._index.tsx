import { json, type LoaderArgs } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { PlusIcon } from '@heroicons/react/20/solid';

import SecurityGroupService, { type SecurityGroup } from '~/services/manage/security-groups.server';
import ClientService, { type Client } from '~/services/manage/clients.server';
import CountryService, { type Country } from '~/services/countries.server';

import Header from "~/components/header";
import Alert, { Level } from '~/components/alert';
import { requireUser } from '~/auth/auth.server';

import { manage } from '~/auth/permissions';
import { Flags } from '~/components/countries/flag';
import toNumber from '~/helpers/to-number';
import Pagination from '~/components/pagination';
import { List, ListItem, ListContext } from '~/components/list';

const LIMIT = 6;

export const loader = async ({ request }: LoaderArgs) => {
  const url = new URL(request.url);
  const offset = toNumber(url.searchParams.get("offset") as string);
  const limit = toNumber(url.searchParams.get("limit") as string) || LIMIT;
  const search = url.searchParams.get("q");
  const sort = url.searchParams.get("sort");
  const securityGroupId = url.searchParams.get("security-group") as string;

  const u = await requireUser(request);
  
  const securityGroupService = SecurityGroupService(u);
  const securityGroups = await securityGroupService.listSecurityGroups();
  const securityGroup = securityGroupId ? securityGroups.find((sc: SecurityGroup) => sc.id === securityGroupId) : undefined;

  const clientService = ClientService(u);
  const { clients, metadata: { count }} = 
    await clientService.searchClients({ search, securityGroup }, { offset, limit, sortDirection: sort });

  const isoCodes = clients.map(s => s.localities || []).flat();
  const countryService = CountryService();
  const countries = await countryService.getCountries({ isoCodes });

  return json({ clients, countries, count, offset, limit, search, securityGroups, securityGroupId });
};

const actions = [
  { title: "add-client", to: "add", icon: PlusIcon, permission: manage.create.client },
];

export default function Clients() {
  const { clients, countries, count, offset, limit, search, securityGroups, securityGroupId } = useLoaderData();

  const filter = {
    title: "Select Security Group",
    filterParam: "security-group",
    selected: securityGroupId,
    filters: securityGroups.map((s: SecurityGroup) => ({ name: s.name, value: s.id }))
  };

  const Context = (client: Client) =>
    <ListContext data={client.securityGroup} select={false} />;

  const Item = (client: Client) =>
    <ListItem data={client.name} sub={<Flags localities={client.localities} countries={countries} />} />

  return (
    <>
      <Header title="clients" actions={actions} additionalFilters={filter}
        filterTitle='Search clients' filterParam='q' allowSort={true} />

      {count <= 0 && <Alert title={`No clients found ${search === null ? '' : `for ${search}`}`} level={Level.Warning} />}

      <List data={clients} renderItem={Item} renderContext={Context} />
      <Pagination entity='client' totalItems={count} offset={offset} limit={limit} />
    </>
  );
}
