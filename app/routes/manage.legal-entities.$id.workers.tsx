import { json, type LoaderArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import LegalEntityService from '~/models/manage/legal-entities.server';
import WorkerService, { Worker } from '~/models/manage/workers.server';
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
  breadcrumb: ({ legalEntity, current }: { legalEntity: any, current: boolean }) => 
    <Breadcrumb to={`/manage/legal-entities/${legalEntity?.id}/workers`} name="workers" current={current} />
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

  const service = LegalEntityService(u);
  const legalEntity = await service.getLegalEntity({ id });

  if (legalEntity === undefined) return notFound('Legal entity not found');

  const workerService = WorkerService(u);
  const { workers, metadata: { count }} = 
    await workerService.searchWorkers({ search, legalEntityId: toNumber(id) }, { offset, limit, sortDirection: sort });

  const isoCodes = workers.map(s => s.locality).reduce((codes: string[], code) => code ? [ code, ...codes ] : codes, []);
  const countryService = CountryService();
  const countries = await countryService.getCountries({ isoCodes });
    
  return json({ legalEntity, workers, count, offset, limit, search, sort, countries });
};

const Workers = () => {
  const { legalEntity, workers, count, offset, limit, search, sort, countries } = useLoaderData();

  const Context = (worker: Worker) =>
    <ListContext chevron={true} />;

  const Item = (worker: Worker) =>
    <ListItem data={`${worker.firstName} ${worker.lastName}`} sub={<Flags localities={[worker.locality]} countries={countries} />} />
  
  return (
    <>
      <div className="flex">
        <div className="flex-grow pt-6">
          <Filter filterTitle='Search workers' filterParam='q' allowSort={true} sort={sort} filter={search} />
        </div>
      </div>

      {count <= 0 && <Alert title={`No workers found ${search === null ? '' : `for ${search}`}`} level={Level.Warning} />}
      <List data={workers} renderItem={Item} renderContext={Context} buildTo={(props: any) => `/manage/workers/${props.item.id}/info`} />
      <Pagination entity='worker' totalItems={count} offset={offset} limit={limit} />
    </>
  );
};

export default Workers;