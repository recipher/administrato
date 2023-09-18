import { json, type LoaderArgs } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { PlusIcon } from '@heroicons/react/20/solid';

import WorkerService, { type Worker } from '~/models/manage/workers.server';
import CountryService, { type Country } from '~/models/countries.server';

import Header from "~/components/header";
import Alert, { Level } from '~/components/alert';
import { requireUser } from '~/auth/auth.server';

import { Flags } from '~/components/countries/flag';

import { manage } from '~/auth/permissions';
import toNumber from '~/helpers/to-number';
import Pagination from '~/components/pagination';

const LIMIT = 6;

export const loader = async ({ request }: LoaderArgs) => {
  const url = new URL(request.url);
  const offset = toNumber(url.searchParams.get("offset") as string);
  const limit = toNumber(url.searchParams.get("limit") as string) || LIMIT;
  const search = url.searchParams.get("q");
  const sort = url.searchParams.get("sort");
  const clientId = toNumber(url.searchParams.get("client") as string);
  const legalEntityId = toNumber(url.searchParams.get("legal-entity") as string);

  const u = await requireUser(request);

  const service = WorkerService(u);
  const { workers, metadata: { count }} = 
    await service.searchWorkers({ search, clientId, legalEntityId }, { offset, limit, sortDirection: sort });


  const isoCodes = workers.map(s => s.locality).reduce((codes: string[], code) => code ? [ code, ...codes ] : codes, []);
  const countryService = CountryService();
  const countries = await countryService.getCountries({ isoCodes });
  
  return json({ workers, count, offset, limit, search, clientId, legalEntityId, countries });
};

const actions = [
  { title: "add-worker", to: "add", icon: PlusIcon, permission: manage.create.worker },
];

export default function Providers() {
  const { workers, count, offset, limit, search, countries } = useLoaderData();
  
  return (
    <>
      <Header title="workers" actions={actions}
        filterTitle='Search workers' filterParam='q' allowSort={true} />

      {count <= 0 && <Alert title={`No workers found ${search === null ? '' : `for ${search}`}`} level={Level.Warning} />}

      <ul className="divide-y divide-gray-100">
        {workers.map((worker: Worker) => (
          <Link key={worker.id} to={`${worker.id}/info`}>
            <li className="flex justify-between gap-x-6 py-5">
              <div className="flex min-w-0 gap-x-4">
                <div className="min-w-0 flex-auto">
                  <p className="text-lg font-semibold leading-6 text-gray-900">
                    {worker.firstName} {worker.lastName}
                  </p>
                  {worker.locality && <Flags localities={[worker.locality]} countries={countries} />}
                </div>
              </div>
              <div className="hidden shrink-0 text-sm sm:flex sm:flex-col sm:items-end">
                <p className="text-sm leading-6 text-gray-900">
                  {worker.client}
                </p>
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  {worker.legalEntity}
                </p>
              </div>
            </li>
          </Link>
        ))}
      </ul>
      <Pagination entity='worker' totalItems={count} offset={offset} limit={limit} />
    </>
  );
}
