import { json, type LoaderArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { PlusIcon } from '@heroicons/react/20/solid';

import { listServiceCentres, type ServiceCentre } from '~/models/service-centres.server';
import { getCountries, type Country } from '~/models/countries.server';

import Header from "~/components/header/with-actions";
import Alert, { Level } from '~/components/alert';
import Image from '~/components/image';
import { requireUser } from '~/auth/auth.server';

import { manage } from '~/auth/permissions';

export const loader = async ({ request }: LoaderArgs) => {
  const user = await requireUser(request);
  const keys = user.keys.serviceCentre;
  const serviceCentres = await listServiceCentres({ keys });

  const isoCodes = serviceCentres.map(s => s.localities || []).flat();
  const countries = await getCountries({ isoCodes });

  return json({ serviceCentres, countries });
};

const actions = [
  { title: "add-service-centre", to: "add", icon: PlusIcon, permission: manage.create.serviceCentre },
];

export default function ServiceCentres() {
  const { serviceCentres, countries } = useLoaderData();

  const country = (isoCode: string) => countries.find((c: Country) => c.isoCode === isoCode);

  return (
    <>
      <Header title="Service Centres" actions={actions} />

      {serviceCentres.length === 0 && <Alert title="No service centres" level={Level.Info} />}
      
      <ul className="divide-y divide-gray-100">
        {serviceCentres.map((serviceCentre: ServiceCentre) => (
          <li key={serviceCentre.id} className="flex justify-between gap-x-6 py-5">
            <div className="flex min-w-0 gap-x-4">
              <div className="min-w-0 flex-auto">
                <p className="text-lg font-semibold leading-6 text-gray-900">
                  {serviceCentre.name}
                </p>
                <p className="mt-1 flex text-xs leading-5 text-gray-500">
                  {serviceCentre.localities?.map(isoCode => {
                    const locality = country(isoCode);
                    const code = locality.parent ? locality.parent : isoCode;
                    return (
                      <span key={code} className="mr-4">
                        <span className="mr-2 text-base float-left">
                          {locality?.name}
                        </span>
                        <Image className="h-6 w-6 bg-white float-right"
                          src={`https://cdn.ipregistry.co/flags/twemoji/${code.toLowerCase()}.svg`} />
                      </span>
                    );
                  })}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-x-6">
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
