import { json, type LoaderArgs } from '@remix-run/node';
import { useLoaderData, useNavigate } from '@remix-run/react';

import ClientService from '~/services/manage/clients.server';
import PersonService, { Person, Classifier } from '~/services/manage/people.server';
import CountryService from '~/services/countries.server';
import Alert, { Level } from '~/components/alert';
import { List, ListItem, ListContext } from '~/components/list';
import Pagination from '~/components/pagination';
import { Filter } from '~/components/header/advanced';
import { Flags } from '~/components/countries/flag';
import Tabs from '~/components/tabs';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";

import { notFound, badRequest } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';
import toNumber from '~/helpers/to-number';
import pluralize from '~/helpers/pluralize';

const LIMIT = 6;

export const handle = {
  name: ({ classifier }: { classifier: Classifier }) => [ 'people', pluralize(classifier) ],
  breadcrumb: ({ client, classifier, current, name }: { client: any, classifier: Classifier } & BreadcrumbProps) => 
    [ <Breadcrumb to={`/manage/clients/${client?.id}/people/worker`} name={name[0]} current={false} />,
      <Breadcrumb to={`/manage/clients/${client?.id}/people/${classifier}`} name={name[1]} current={current} /> ]
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const url = new URL(request.url);
  const offset = toNumber(url.searchParams.get("offset") as string);
  const limit = toNumber(url.searchParams.get("limit") as string) || LIMIT;
  const search = url.searchParams.get("q");
  const sort = url.searchParams.get("sort");

  const { id, classifier } = params;

  if (id === undefined || classifier === undefined) return badRequest('Invalid request');

  const u = await requireUser(request);

  const service = ClientService(u);
  const client = await service.getClient({ id });

  if (client === undefined) return notFound('Client not found');

  const personService = PersonService(u);
  const { people, metadata: { count }} = 
    await personService.searchPeople({ search, clientId: id, classifier: classifier as Classifier }, { offset, limit, sortDirection: sort });

  const isoCodes = people.map(s => s.locality).reduce((codes: string[], code) => code ? [ code, ...codes ] : codes, []);
  const countryService = CountryService();
  const countries = await countryService.getCountries({ isoCodes });
    
  return json({ client, people, count, offset, limit, search, sort, countries, classifier });
};

const Workers = () => {
  const navigate = useNavigate();

  const { people, count, offset, limit, search, sort, countries, classifier } = useLoaderData();

  const Context = (person: Person) => <ListContext data={person.legalEntity} select={true} />;

  const Item = (person: Person) =>
    <ListItem data={`${person.firstName} ${person.lastName}`} sub={<Flags localities={[person.locality]} countries={countries} />} />
  
  const plural = pluralize(classifier);

  const tabs = [ "worker", "contractor" ].map(value => ({ name: pluralize(value), value }));

  return (
    <>
      <Tabs tabs={tabs} selected={classifier} onClick={(classifier: string) => navigate(`../people/${classifier}`)} />

      <div className="flex">
        <div className="flex-grow pt-6">
          <Filter filterTitle={`Search ${plural}`} filterParam='q' allowSort={true} sort={sort} filter={search} />
        </div>
      </div>

      {count <= 0 && <Alert title={`No ${plural} found ${search === null ? '' : `for ${search}`}`} level={Level.Warning} />}
      <List data={people} renderItem={Item} renderContext={Context} buildTo={(props: any) => `/manage/people/${classifier}/${props.item.id}/info`} />
      <Pagination entity={classifier} totalItems={count} offset={offset} limit={limit} />
    </>
  );
};

export default Workers;
