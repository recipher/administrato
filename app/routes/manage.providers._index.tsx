import { json, type LoaderArgs } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { PlusIcon } from '@heroicons/react/20/solid';

import ServiceCentreService, { type ServiceCentre } from '~/models/manage/service-centres.server';
import ProviderService, { type Provider } from '~/models/manage/providers.server';
import CountryService from '~/models/countries.server';

import Header from "~/components/header";
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
  const serviceCentreId = toNumber(url.searchParams.get("service-centre") as string);

  const u = await requireUser(request);
  
  const serviceCentreService = ServiceCentreService(u);
  const serviceCentres = await serviceCentreService.listServiceCentres();

  const service = ProviderService(u);
  const { providers, metadata: { count }} = 
    await service.searchProviders({ search, serviceCentreId }, { offset, limit, sortDirection: sort });

  const isoCodes = providers.map(s => s.localities || []).flat();
  const countryService = CountryService();
  const countries = await countryService.getCountries({ isoCodes });

  return json({ providers, countries, count, offset, limit, search, serviceCentres, serviceCentreId });
};

const actions = [
  { title: "add-provider", to: "add", icon: PlusIcon, permission: manage.create.provider },
];

export default function Providers() {
  const { providers, countries, count, offset, limit, search, serviceCentres, serviceCentreId } = useLoaderData();

  const filter = {
    title: "Select Service Centre",
    filterParam: "service-centre",
    selected: serviceCentreId,
    filters: serviceCentres.map((s: ServiceCentre) => ({ name: s.name, value: s.id }))
  };
  
  return (
    <>
      <Header title="providers" actions={actions} additionalFilters={filter}
        filterTitle='Search providers' filterParam='q' allowSort={true} />

      {count <= 0 && <Alert title={`No providers found ${search === null ? '' : `for ${search}`}`} level={Level.Warning} />}

      <ul className="divide-y divide-gray-100">
        {providers.map((provider: Provider) => (
          <Link key={provider.id} to={`${provider.id}/info`}>
            <li className="flex justify-between gap-x-6 py-5">
              <div className="flex min-w-0 gap-x-4">
                <div className="min-w-0 flex-auto">
                  <p className="text-lg font-semibold leading-6 text-gray-900">
                    {provider.name}
                  </p>
                  <Flags localities={provider.localities} countries={countries} />
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-x-6">
              </div>
            </li>
          </Link>
        ))}
      </ul>
      <Pagination entity='provider' totalItems={count} offset={offset} limit={limit} />
    </>
  );
}
