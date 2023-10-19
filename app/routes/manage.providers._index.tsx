import { json, type LoaderArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { PlusIcon } from '@heroicons/react/20/solid';

import SecurityGroupService, { type SecurityGroup } from '~/services/manage/security-groups.server';
import ProviderService, { type Provider } from '~/services/manage/providers.server';
import CountryService from '~/services/countries.server';

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
  const securityGroupId = url.searchParams.get("security-group") ;

  const u = await requireUser(request);
  
  const securityGroupService = SecurityGroupService(u);
  const securityGroups = await securityGroupService.listSecurityGroups();
  const securityGroup = securityGroupId ? securityGroups.find((sg: SecurityGroup) => sg.id === securityGroupId) : undefined;

  const service = ProviderService(u);
  const { providers, metadata: { count }} = 
    await service.searchProviders({ search, securityGroup }, { offset, limit, sortDirection: sort });

  const isoCodes = providers.map(s => s.localities || []).flat();
  const countryService = CountryService();
  const countries = await countryService.getCountries({ isoCodes });

  return json({ providers, countries, count, offset, limit, search, securityGroups, securityGroupId });
};

const actions = [
  { title: "add-provider", to: "add", icon: PlusIcon, permission: manage.create.provider },
];

export default function Providers() {
  const { providers, countries, count, offset, limit, search, securityGroups, securityGroupId } = useLoaderData();

  const filter = {
    title: "Select Security Group",
    filterParam: "security-group",
    selected: securityGroupId,
    filters: securityGroups.map((s: SecurityGroup) => ({ name: s.name, value: s.id }))
  };

  const Context = (provider: Provider) =>
    <ListContext data={provider.securityGroup} select={false} />;

  const Item = (provider: Provider) =>
    <ListItem data={provider.name} sub={<Flags localities={provider.localities} countries={countries} />} />
  
  return (
    <>
      <Header title="providers" actions={actions} additionalFilters={filter}
        filterTitle='Search providers' filterParam='q' allowSort={true} />

      {count <= 0 && <Alert title={`No providers found ${search === null ? '' : `for ${search}`}`} level={Level.Warning} />}

      <List data={providers} renderItem={Item} renderContext={Context} />
      <Pagination entity='provider' totalItems={count} offset={offset} limit={limit} />
    </>
  );
}
