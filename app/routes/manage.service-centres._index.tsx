import { json, type LoaderArgs } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { PlusIcon } from '@heroicons/react/20/solid';

import ServiceCentreService, { type ServiceCentre } from '~/models/manage/service-centres.server';
import CountryService from '~/models/countries.server';

import Header from "~/components/header/with-actions";
import Alert, { Level } from '~/components/alert';
import { requireUser } from '~/auth/auth.server';

import { Flags } from '~/components/countries/flag';

import { manage } from '~/auth/permissions';

export const loader = async ({ request }: LoaderArgs) => {
  const url = new URL(request.url);
  const allowFullAccess = !!url.searchParams.get("full");

  const user = await requireUser(request);
  
  const serviceCentreService = ServiceCentreService(user);
  const serviceCentres = await serviceCentreService.listServiceCentres({ allowFullAccess });

  const isoCodes = serviceCentres.map(s => s.localities || []).flat();
  const countryService = CountryService();
  const countries = await countryService.getCountries({ isoCodes });

  return json({ serviceCentres, countries });
};

const actions = [
  { title: "add-service-centre", to: "add", icon: PlusIcon, permission: manage.create.serviceCentre },
];

export default function ServiceCentres() {
  const { serviceCentres, countries } = useLoaderData();

  return (
    <>
      <Header title="Service Centres" actions={actions} />

      {serviceCentres.length === 0 && <Alert title="No service centres" level={Level.Info} />}
      
      <ul className="divide-y divide-gray-100">
        {serviceCentres.map((serviceCentre: ServiceCentre) => (
          <Link key={serviceCentre.id} to={`${serviceCentre.id}/info`}>
            <li className="flex justify-between gap-x-6 py-5">
              <div className="flex min-w-0 gap-x-4">
                <div className="min-w-0 flex-auto">
                  <p className="text-lg font-semibold leading-6 text-gray-900">
                    {serviceCentre.name}
                  </p>
                  <Flags localities={serviceCentre.localities} countries={countries} />
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-x-6">
              </div>
            </li>
          </Link>
        ))}
      </ul>
    </>
  );
}
