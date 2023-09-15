import { json, type LoaderArgs } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { PlusIcon } from '@heroicons/react/20/solid';

import ClientService, { type Client } from '~/models/manage/clients.server';
import CountryService, { type Country } from '~/models/countries.server';

import Header from "~/components/header/with-actions";
import Alert, { Level } from '~/components/alert';
import { requireUser } from '~/auth/auth.server';

import { manage } from '~/auth/permissions';
import { Flags } from '~/components/countries/flag';
import toNumber from '~/helpers/to-number';
import Pagination from '~/components/pagination';

const LIMIT = 6;

export const loader = async ({ request }: LoaderArgs) => {
  const url = new URL(request.url);
  const offset = toNumber(url.searchParams.get("offset") as string);
  const limit = toNumber(url.searchParams.get("limit") as string) || LIMIT;
  const search = url.searchParams.get("q");
  const sort = url.searchParams.get("sort");
  // const serviceCentreId = url.searchParams.get("service-centre");

  const u = await requireUser(request);
  
  const clientService = ClientService(u);
  const { clients, metadata: { count }} = 
    await clientService.searchClients({ search }, { offset, limit, sortDirection: sort });

  const isoCodes = clients.map(s => s.localities || []).flat();
  const countryService = CountryService();
  const countries = await countryService.getCountries({ isoCodes });

  return json({ clients, countries, count, offset, limit, search });
};

const actions = [
  { title: "add-client", to: "add", icon: PlusIcon, permission: manage.create.client },
];

export default function Clients() {
  const { clients, countries, count, offset, limit, search } = useLoaderData();

  return (
    <>
      <Header title="clients" actions={actions} />
      {/* <Header title='holidays' filterTitle='Search countries' filterParam='q' allowSort={true} /> */}

      {count <= 0 && <Alert title={`No clients found ${search === null ? '' : `for ${search}`}`} level={Level.Warning} />}

      <ul className="divide-y divide-gray-100">
        {clients.map((client: Client) => (
          <Link key={client.id} to={`${client.id}/info`}>
            <li className="flex justify-between gap-x-6 py-5">
              <div className="flex min-w-0 gap-x-4">
                <div className="min-w-0 flex-auto">
                  <p className="text-lg font-semibold leading-6 text-gray-900">
                    {client.name}
                  </p>
                  <Flags localities={client.localities} countries={countries} />
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-x-6">
              </div>
            </li>
          </Link>
        ))}
      </ul>
      <Pagination entity='client' totalItems={count} offset={offset} limit={limit} />
    </>
  );
}
