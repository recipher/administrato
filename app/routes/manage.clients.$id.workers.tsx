import { json, type LoaderArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import ClientService from '~/models/manage/clients.server';
import PersonService, { Person } from '~/models/manage/people.server';
import CountryService from '~/models/countries.server';
import Alert, { Level } from '~/components/alert';
import { List, ListItem, ListContext } from '~/components/list';
import Pagination from '~/components/pagination';
import { Filter } from '~/components/header/advanced';
import { Flags } from '~/components/countries/flag';

import { Breadcrumb } from "~/layout/breadcrumbs";

import { notFound, badRequest } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';
import toNumber from '~/helpers/to-number';

const LIMIT = 6;

export const handle = {
  breadcrumb: ({ client, current }: { client: any, current: boolean }) => 
    <Breadcrumb to={`/manage/clients/${client?.id}/workers`} name="clients" current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const url = new URL(request.url);
  const offset = toNumber(url.searchParams.get("offset") as string);
  const limit = toNumber(url.searchParams.get("limit") as string) || LIMIT;
  const search = url.searchParams.get("q");
  const sort = url.searchParams.get("sort");

  const { id } = params;

  if (id === undefined) return badRequest('Invalid request');

  const u = await requireUser(request);

  const service = ClientService(u);
  const client = await service.getClient({ id });

  if (client === undefined) return notFound('Client not found');

  const personService = PersonService(u);
  const { people, metadata: { count }} = 
    await personService.searchPeople({ search, clientId: id }, { offset, limit, sortDirection: sort });

  const isoCodes = people.map(s => s.locality).reduce((codes: string[], code) => code ? [ code, ...codes ] : codes, []);
  const countryService = CountryService();
  const countries = await countryService.getCountries({ isoCodes });
    
  return json({ client, people, count, offset, limit, search, sort, countries });
};

const Workers = () => {
  const { client, people, count, offset, limit, search, sort, countries } = useLoaderData();

  const Context = (person: Person) =>
    <ListContext select={true} />;

  const Item = (person: Person) =>
    <ListItem data={`${person.firstName} ${person.lastName}`} sub={<Flags localities={[person.locality]} countries={countries} />} />
  
  return (
    <>
      <div className="flex">
        <div className="flex-grow pt-6">
          <Filter filterTitle='Search workers' filterParam='q' allowSort={true} sort={sort} filter={search} />
        </div>
      </div>

      {count <= 0 && <Alert title={`No workers found ${search === null ? '' : `for ${search}`}`} level={Level.Warning} />}
      <List data={people} renderItem={Item} renderContext={Context} buildTo={(props: any) => `/manage/workers/${props.item.id}/info`} />
      <Pagination entity='worker' totalItems={count} offset={offset} limit={limit} />
    </>
  );
};

export default Workers;
