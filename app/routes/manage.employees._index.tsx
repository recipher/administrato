import { json, type LoaderArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { PlusIcon } from '@heroicons/react/20/solid';

import PersonService, { type Person } from '~/models/manage/people.server';
import CountryService from '~/models/countries.server';

import Header from "~/components/header";
import Alert, { Level } from '~/components/alert';
import { requireUser } from '~/auth/auth.server';

import { Flags } from '~/components/countries/flag';

import { manage } from '~/auth/permissions';
import toNumber from '~/helpers/to-number';
import Pagination from '~/components/pagination';

import { List, ListContext, ListItem } from '~/components/list';

const LIMIT = 6;

export const loader = async ({ request }: LoaderArgs) => {
  const u = await requireUser(request);

  const url = new URL(request.url);
  const offset = toNumber(url.searchParams.get("offset") as string);
  const limit = toNumber(url.searchParams.get("limit") as string) || LIMIT;
  const search = url.searchParams.get("q");
  const sort = url.searchParams.get("sort");
  
  const legalEntityId = url.searchParams.get("legal-entity");

  const service = PersonService(u);
  const { people, metadata: { count }} = 
    await service.searchEmployees({ search, legalEntityId }, { offset, limit, sortDirection: sort });

  const isoCodes = people.map(s => s.locality).reduce((codes: string[], code) => code ? [ code, ...codes ] : codes, []);
  const countryService = CountryService();
  const countries = await countryService.getCountries({ isoCodes });
  
  return json({ people, count, offset, limit, search, legalEntityId, countries });
};

const actions = [
  { title: "add-employee", to: "add", icon: PlusIcon, permission: manage.create.worker },
];

const navigation = [
  { name: "workers", to: "/manage/workers", permission: manage.read.worker },
  { name: "contractors", to: "/manage/contractors", permission: manage.read.worker },
  { name: "employees", to: "/manage/employees", permission: manage.read.worker },
];

export default function Workers() {
  const { people, count, offset, limit, search, countries } = useLoaderData();

  const Context = (person: Person) =>
    <ListContext data={person.legalEntity} select={false} />;

  const Employee = (person: Person) =>
    <ListItem data={`${person.firstName} ${person.lastName}`} sub={<Flags localities={[person.locality]} countries={countries} />} />
    
  return (
    <>
      <Header title="employees" navigation={navigation} actions={actions}
        filterTitle='Search employees' filterParam='q' allowSort={true} />

      {count <= 0 && <Alert title={`No employees found ${search === null ? '' : `for ${search}`}`} level={Level.Warning} />}

      <List data={people} renderItem={Employee} renderContext={Context} />
      <Pagination entity='employee' totalItems={count} offset={offset} limit={limit} />
    </>
  );
}