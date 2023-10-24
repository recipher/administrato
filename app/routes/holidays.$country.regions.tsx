import { json, type LoaderArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import CountryService from '~/services/countries.server';
import Alert, { Level } from '~/components/alert';
import { Basic as List } from '~/components/list';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";

import { badRequest } from '~/utility/errors';

export const handle = {
  name: "regions",
  breadcrumb: ({ country, current, name }: { country: any } & BreadcrumbProps) => 
    <Breadcrumb to={`/holidays/${country?.isoCode}/regions`} name={name} current={current} />
};

export const loader = async ({ params }: LoaderArgs) => {
  const { country: isoCode } = params;

  if (isoCode === undefined) return badRequest('Invalid request');

  const service = CountryService();
  const region = await service.getCountry({ isoCode });
  const regions = await service.listRegionsByCountry({ parent: isoCode });

  return json({ country: { isoCode }, regions, region, countries: regions });
};

export default function Regions() {
  const { regions, region } = useLoaderData();

  return (
    <>
      {regions.length === 0 && <Alert level={Level.Info} title={`No regions in ${region.name}`} />}

      <List data={regions} idKey="isoCode" buildTo={({ item }) => `../../${item.isoCode}`} />
    </>
  );
}
