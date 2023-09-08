import { type LoaderArgs } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';

import { ChevronRightIcon } from '@heroicons/react/24/outline'

import { getCountry, listRegionsByCountry } from '~/models/countries.server';
import Alert, { Level } from '~/components/alert';
import { List } from '~/components/list';

import { Breadcrumb } from "~/layout/breadcrumbs";

import { badRequest } from '~/utility/errors';

export const handle = {
  breadcrumb: ({ country, current }: { country: any, current: boolean }) => 
    <Breadcrumb to={`/holidays/${country?.isoCode}/regions`} name="Regions" current={current} />
};

export const loader = async ({ params }: LoaderArgs) => {
  const { country: isoCode } = params;

  if (isoCode === undefined) return badRequest('Invalid request');

  const region = await getCountry({ isoCode });
  const regions = await listRegionsByCountry({ parent: isoCode });

  return { country: { isoCode }, regions, region };
};

export default function Holidays() {
  const { regions, region } = useLoaderData();

  return (
    <>
      {regions.length === 0 && <Alert level={Level.Info} title={`No regions for ${region.name}`} />}

      <List data={regions} idKey="isoCode" />
    </>
  );
}
