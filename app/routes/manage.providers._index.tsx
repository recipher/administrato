import { json, type LoaderArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
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
import { List, ListItem, ListContext } from '~/components/list';

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

  const Context = (provider: Provider) =>
    <ListContext data={serviceCentres.find((sc: ServiceCentre) => sc.id === provider.serviceCentreId)?.name} select={false} />;

  const Item = (provider: Provider) =>
    <ListItem data={provider.name} sub={<Flags localities={provider.localities} countries={countries} />} />
  
  return (
    <>
      <Header title="providers" actions={actions} additionalFilters={filter}
        filterTitle='Search providers' filterParam='q' allowSort={true} />

      {count <= 0 && <Alert title={`No providers found ${search === null ? '' : `for ${search}`}`} level={Level.Warning} />}

      <List data={providers} renderItem={Item} renderContext={Context} />
      <Pagination entity='provider' totalItems={count} offset={offset} limit={limit} />
    </>
  );
}
