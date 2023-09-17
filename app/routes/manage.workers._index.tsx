import { json, type LoaderArgs } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { PlusIcon } from '@heroicons/react/20/solid';

import WorkerService, { type Worker } from '~/models/manage/workers.server';

import Header from "~/components/header";
import Alert, { Level } from '~/components/alert';
import { requireUser } from '~/auth/auth.server';

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

  return json({ workers, count, offset, limit, search, clientId, legalEntityId });
};

const actions = [
  { title: "add-worker", to: "add", icon: PlusIcon, permission: manage.create.worker },
];

export default function Providers() {
  const { workers, count, offset, limit, search } = useLoaderData();
  
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
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-x-6">
              </div>
            </li>
          </Link>
        ))}
      </ul>
      <Pagination entity='worker' totalItems={count} offset={offset} limit={limit} />
    </>
  );
}
