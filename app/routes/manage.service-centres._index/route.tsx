import type { LoaderArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { PlusIcon } from '@heroicons/react/20/solid';
import { listServiceCentres } from '~/models/service-centres.server';
import type { SecurityKeys, ServiceCentre } from '~/models/service-centres.server';
import Header from "~/components/header/with-actions";
import Alert, { Level } from '~/components/alert';
import Image from '~/components/image';
import { requireProfile } from '~/auth/auth.server';

import { manage } from '~/auth/permissions';

export const loader = async ({ request }: LoaderArgs) => {
  const user = await requireProfile(request);
  const keys = user.keys.serviceCentre as SecurityKeys;
  const serviceCentres = await listServiceCentres({ keys });

  return { serviceCentres };
};

const actions = [
  { title: "Add Service Centre", to: "add", icon: PlusIcon, permission: manage.create.serviceCentre },
];

export default function ServiceCentres() {
  const { serviceCentres } = useLoaderData();

  return (
    <>
      <Header title="Service Centres" actions={actions} />

      {serviceCentres.length === 0 && <Alert title="No service centres" level={Level.Info} />}
      
      <ul role="list" className="divide-y divide-gray-100">
        {serviceCentres.map((serviceCentre: ServiceCentre) => (
          <li key={serviceCentre.id} className="flex justify-between gap-x-6 py-5">
            <div className="flex min-w-0 gap-x-4">
              <div className="min-w-0 flex-auto">
                <p className="text-lg font-semibold leading-6 text-gray-900">
                  {serviceCentre.name}
                </p>
                <p className="mt-1 flex text-xs leading-5 text-gray-500">
                  {serviceCentre.localities?.map(code => 
                    <Image key={code} className="h-6 w-6 flex-none bg-white mr-2"
                      src={`https://cdn.ipregistry.co/flags/twemoji/${code.toLowerCase()}.svg`} />)}
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
