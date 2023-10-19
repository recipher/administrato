import { json, type LoaderArgs } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { PlusIcon } from '@heroicons/react/20/solid';

import SecurityGroupService, { type SecurityGroup } from '~/services/manage/security-groups.server';
import LegalEntityService, { type LegalEntity } from '~/services/manage/legal-entities.server';
import CountryService from '~/services/countries.server';

import Header from "~/components/header";
import Alert, { Level } from '~/components/alert';
import { requireUser } from '~/auth/auth.server';

import { manage } from '~/auth/permissions';
import { Flags } from '~/components/countries/flag';
import Pagination from '~/components/pagination';
import { List, ListItem, ListContext } from '~/components/list';
import toNumber from '~/helpers/to-number';

const LIMIT = 6;

export const loader = async ({ request }: LoaderArgs) => {
  const url = new URL(request.url);
  const offset = toNumber(url.searchParams.get("offset") as string);
  const limit = toNumber(url.searchParams.get("limit") as string) || LIMIT;
  const search = url.searchParams.get("q");
  const sort = url.searchParams.get("sort");
  const securityGroupId = url.searchParams.get("security-group");

  const u = await requireUser(request);

  const securityGroupService = SecurityGroupService(u);
  const securityGroups = await securityGroupService.listSecurityGroups();
  const securityGroup = securityGroupId ? securityGroups.find((sc: SecurityGroup) => sc.id === securityGroupId) : undefined;

  const service = LegalEntityService(u);
  const { legalEntities, metadata: { count }} = 
    await service.searchLegalEntities({ search, securityGroup }, { offset, limit, sortDirection: sort });

  const isoCodes = legalEntities.map((le: LegalEntity) => le.localities || []).flat();
  const countryService = CountryService();
  const countries = await countryService.getCountries({ isoCodes });

  return json({ legalEntities, countries, count, offset, limit, search, securityGroups, securityGroupId });
};

const actions = [
  { title: "add-legal-entity", to: "add", icon: PlusIcon, permission: manage.create.legalEntity },
];

export default function LegalEntities() {
  const { legalEntities, countries, count, offset, limit, search, securityGroups, securityGroupId } = useLoaderData();

  const filter = {
    title: "Select Security Group",
    filterParam: "security-group",
    selected: securityGroupId,
    filters: securityGroups.map((s: SecurityGroup) => ({ name: s.name, value: s.id }))
  };
  
  const Context = (legalEntity: LegalEntity) =>
    <ListContext data={legalEntity.securityGroup} select={false} />;

  const Item = (legalEntity: LegalEntity) =>
    <ListItem data={legalEntity.name} sub={<Flags localities={legalEntity.localities} countries={countries} />} />

  return (
    <>
      <Header title="legal-entities" actions={actions} additionalFilters={filter}
        filterTitle='Search legal entities' filterParam='q' allowSort={true} />

      {count <= 0 && <Alert title={`No legal entities found ${search === null ? '' : `for ${search}`}`} level={Level.Warning} />}
      <List data={legalEntities} renderItem={Item} renderContext={Context} />
      <Pagination entity='legal-entity' totalItems={count} offset={offset} limit={limit} />
    </>
  );
}
