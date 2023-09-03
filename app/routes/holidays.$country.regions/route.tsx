import { redirect, type LoaderArgs } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';

import { ChevronRightIcon } from '@heroicons/react/24/outline'

import { listRegionsByCountry } from '~/models/countries.server';
import Empty from '~/layout/empty';

export const loader = async ({ params }: LoaderArgs) => {
  const { country: isoCode } = params;

  if (isoCode === undefined) return redirect('../..');

  const regions = await listRegionsByCountry(isoCode);

  return { regions };
};

export default function Holidays() {
  const { regions } = useLoaderData();

  return (
    <>
      <Empty data={regions} entity='holiday' message='sync' />

      <ul role="list" className="divide-y divide-gray-100">
        {regions.map((region: any) => (
          <li key={region.isoCode}>
            <Link to={`../../${region.isoCode}`} className="flex justify-between gap-x-6 py-3">
              <div className="flex min-w-0 gap-x-4">
                <div className="min-w-0 flex-auto">
                  <p className="text-sm font-semibold leading-6 text-gray-900">
                    {region.name}
                  </p>
                  <p className="mt-1 flex text-xs leading-5 text-gray-500">
                    {region.isoCode}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-x-6">
                <div className="hidden sm:flex sm:flex-col sm:items-end">
                </div>
                <ChevronRightIcon className="h-5 w-5 flex-none text-gray-400" aria-hidden="true" />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
