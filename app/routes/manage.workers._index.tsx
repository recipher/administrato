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
  const clientId = url.searchParams.get("client");
  const legalEntityId = url.searchParams.get("legal-entity");

  const service = PersonService(u);
  const { people, metadata: { count }} = 
    await service.searchWorkers({ search, clientId, legalEntityId }, { offset, limit, sortDirection: sort });

  const isoCodes = people.map(s => s.locality).reduce((codes: string[], code) => code ? [ code, ...codes ] : codes, []);
  const countryService = CountryService();
  const countries = await countryService.getCountries({ isoCodes });
  
  return json({ people, count, offset, limit, search, clientId, legalEntityId, countries });
};

const actions = [
  { title: "add-worker", to: "add", icon: PlusIcon, permission: manage.create.worker },
];

export default function Workers() {
  const { people, count, offset, limit, search, countries } = useLoaderData();

  const Context = (person: Person) =>
    <ListContext data={person.client} sub={person.legalEntity} select={false} />;

  const Worker = (person: Person) =>
    <ListItem data={`${person.firstName} ${person.lastName}`} sub={<Flags localities={[person.locality]} countries={countries} />} />
    
  return (
    <>
      <Header title="workers" actions={actions}
        filterTitle='Search workers' filterParam='q' allowSort={true} />

      {count <= 0 && <Alert title={`No workers found ${search === null ? '' : `for ${search}`}`} level={Level.Warning} />}

      <List data={people} renderItem={Worker} renderContext={Context} />
      <Pagination entity='worker' totalItems={count} offset={offset} limit={limit} />
    </>
  );
}
