import { json, type LoaderArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { PlusIcon } from '@heroicons/react/20/solid';

import { badRequest } from '~/utility/errors';

import PersonService, { type Person, Classifier } from '~/services/manage/people.server';
import CountryService from '~/services/countries.server';

import Header from "~/components/header";
import Alert, { Level } from '~/components/alert';
import { requireUser } from '~/auth/auth.server';

import { Flags } from '~/components/countries/flag';

import { manage } from '~/auth/permissions';
import toNumber from '~/helpers/to-number';
import Pagination from '~/components/pagination';

import { List, ListContext, ListItem } from '~/components/list';
import pluralize from '~/helpers/pluralize';

import { configs } from './manage.people';

const LIMIT = 6;

export const loader = async ({ request, params }: LoaderArgs) => {
  const u = await requireUser(request);

  const { classifier } = params;
  if (classifier === undefined) return badRequest('Invalid data');

  const config = configs.get(classifier);

  const url = new URL(request.url);
  const offset = toNumber(url.searchParams.get("offset") as string);
  const limit = toNumber(url.searchParams.get("limit") as string) || LIMIT;
  const search = url.searchParams.get("q");
  const sort = url.searchParams.get("sort");

  const clientId = url.searchParams.get("client");
  const legalEntityId = url.searchParams.get("legal-entity");

  const service = PersonService(u);
  const { people, metadata: { count }} = 
    await service.searchPeople({ search, clientId, legalEntityId, classifier: classifier as Classifier }, { offset, limit, sortDirection: sort });

  const isoCodes = people.map(s => s.locality).reduce((codes: string[], code) => code ? [ code, ...codes ] : codes, []);
  const countryService = CountryService();
  const countries = await countryService.getCountries({ isoCodes });
  
  return json({ people, count, offset, limit, search, clientId, legalEntityId, countries, classifier, config });
};

export default function People() {
  const { people, count, offset, limit, search, countries, classifier, config } = useLoaderData();

  const Context = (person: Person) =>
    config.client
      ? <ListContext data={person.client} sub={person.legalEntity} select={false} />
      : <ListContext data={person.legalEntity} select={false} />;

  const Item = (person: Person) =>
    <ListItem data={`${person.firstName} ${person.lastName}`} sub={<Flags localities={[person.locality]} countries={countries} />} />

  const actions = [
    { title: `add-${classifier}`, to: "add", icon: PlusIcon, permission: manage.create.person },
  ];

  const navigation = [
    { name: "workers", to: "/manage/people/worker", permission: manage.read.person },
    { name: "contractors", to: "/manage/people/contractor", permission: manage.read.person },
    { name: "employees", to: "/manage/people/employee", permission: manage.read.person },
  ];

  const plural = pluralize(classifier);

  return (
    <>
      <Header title={plural} navigation={navigation} actions={actions}
        filterTitle={`Search ${plural}`} filterParam='q' allowSort={true} />

      {count <= 0 && <Alert title={`No ${plural} found ${search === null ? '' : `for ${search}`}`} level={Level.Warning} />}

      <List data={people} renderItem={Item} renderContext={Context} />
      <Pagination entity={classifier} totalItems={count} offset={offset} limit={limit} />
    </>
  );
}
