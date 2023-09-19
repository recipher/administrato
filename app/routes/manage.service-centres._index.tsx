import { json, type LoaderArgs } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { PlusIcon } from '@heroicons/react/20/solid';

import ServiceCentreService, { type ServiceCentre } from '~/models/manage/service-centres.server';
import CountryService from '~/models/countries.server';

import { Basic as Header } from "~/components/header";
import Alert, { Level } from '~/components/alert';
import { requireUser } from '~/auth/auth.server';

import { Flags } from '~/components/countries/flag';
import { List, ListItem, ListContext } from '~/components/list';

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

  const Context = (serviceCentre: ServiceCentre) =>
    <ListContext chevron={true} />;

  const Item = (serviceCentre: ServiceCentre) =>
    <ListItem data={serviceCentre.name} sub={<Flags localities={serviceCentre.localities} countries={countries} />} />

  return (
    <>
      <Header title="Service Centres" actions={actions} />

      {serviceCentres.length === 0 && <Alert title="No service centres found" level={Level.Warning} />}
      <List data={serviceCentres} renderItem={Item} renderContext={Context} />
    </>
  );
}
