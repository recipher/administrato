import { json, type LoaderArgs } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { PlusIcon } from '@heroicons/react/20/solid';

import ServiceCentreService, { type ServiceCentre } from '~/models/manage/service-centres.server';
import LegalEntityService, { type LegalEntity } from '~/models/manage/legal-entities.server';
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

  const service = LegalEntityService(u);
  const { legalEntities, metadata: { count }} = 
    await service.searchLegalEntities({ search, serviceCentreId }, { offset, limit, sortDirection: sort });

  const isoCodes = legalEntities.map(s => s.localities || []).flat();
  const countryService = CountryService();
  const countries = await countryService.getCountries({ isoCodes });

  return json({ legalEntities, countries, count, offset, limit, search, serviceCentres, serviceCentreId });
};

const actions = [
  { title: "add-legal-entity", to: "add", icon: PlusIcon, permission: manage.create.legalEntity },
];

export default function LegalEntities() {
  const { legalEntities, countries, count, offset, limit, search, serviceCentres, serviceCentreId } = useLoaderData();

  const filter = {
    title: "Select Service Centre",
    filterParam: "service-centre",
    selected: serviceCentreId,
    filters: serviceCentres.map((s: ServiceCentre) => ({ name: s.name, value: s.id }))
  };
  
  return (
    <>
      <Header title="legal-entities" actions={actions} additionalFilters={filter}
        filterTitle='Search legal entities' filterParam='q' allowSort={true} />

      {count <= 0 && <Alert title={`No legal entities found ${search === null ? '' : `for ${search}`}`} level={Level.Warning} />}

      <ul className="divide-y divide-gray-100">
        {legalEntities.map((legalEntity: LegalEntity) => (
          <Link key={legalEntity.id} to={`${legalEntity.id}/info`}>
            <li className="flex justify-between gap-x-6 py-5">
              <div className="flex min-w-0 gap-x-4">
                <div className="min-w-0 flex-auto">
                  <p className="text-lg font-semibold leading-6 text-gray-900">
                    {legalEntity.name}
                  </p>
                  <Flags localities={legalEntity.localities} countries={countries} />
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-x-6">
                <span className="text-sm text-gray-800">
                  {serviceCentres.find((sc: ServiceCentre) => sc.id === legalEntity.serviceCentreId)?.name}
                </span>
              </div>
            </li>
          </Link>
        ))}
      </ul>
      <Pagination entity='legal-entity' totalItems={count} offset={offset} limit={limit} />
    </>
  );
}
