import { type LoaderArgs } from '@remix-run/node';
import { Outlet, useLoaderData } from '@remix-run/react';

import { getCountry } from '~/models/countries.server';
import Header from '~/components/header/with-actions';
import Image from '~/components/image';

const tabs = [
  { name: 'Holidays', to: 'holidays' },
  { name: 'Regions', to: 'regions' },
  { name: 'Overrides', to: 'overrides' },
];

export const loader = async ({ params }: LoaderArgs) => {
  const { country: isoCode } = params;

  if (isoCode === undefined) return;

  const country = await getCountry(isoCode);

  return { country };
};

export default function Holidays() {
  const { country } = useLoaderData();

  const icon = <Image className="h-6 w-6 flex-none bg-white mr-4"
    src={`https://cdn.ipregistry.co/flags/twemoji/${country.isoCode.toLowerCase()}.svg`} />;

  return (
    <>
      <Header title={country.name} subtitle={country.isoCode} tabs={tabs} icon={icon} />
      <Outlet />
    </>
  );
}
