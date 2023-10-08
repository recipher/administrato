import { json, type LoaderArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import ServiceCentreService from '~/services/manage/service-centres.server';
import ProviderService, { Provider } from '~/services/manage/providers.server';
import CountryService from '~/services/countries.server';
import Alert, { Level } from '~/components/alert';
import { List, ListItem, ListContext } from '~/components/list';
import Pagination from '~/components/pagination';
import { Filter } from '~/components/header/advanced';
import { Flags } from '~/components/countries/flag';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";

import { notFound, badRequest } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';
import toNumber from '~/helpers/to-number';

const LIMIT = 6;

export const handle = {
  name: "providers",
  breadcrumb: ({ serviceCentre, current, name }: { serviceCentre: any } & BreadcrumbProps) => 
    <Breadcrumb to={`/manage/service-centres/${serviceCentre?.id}/providers`} name={name} current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const url = new URL(request.url);
  const offset = toNumber(url.searchParams.get("offset") as string);
  const limit = toNumber(url.searchParams.get("limit") as string) || LIMIT;
  const search = url.searchParams.get("q");
  const sort = url.searchParams.get("sort");
  const all = url.searchParams.get("all") === "true";

  const { id } = params;

  if (id === undefined) return badRequest('Invalid request');

  const u = await requireUser(request);

  const service = ServiceCentreService(u);
  const serviceCentre = await service.getServiceCentre({ id });

  if (serviceCentre === undefined) return notFound('Service centre not found');

  const providerService = ProviderService(u);
  const { providers, metadata: { count }} = 
    await providerService.searchProviders({ search, 
      serviceCentreId: all ? undefined : id,
      serviceCentre: all ? serviceCentre : undefined
    }, { offset, limit, sortDirection: sort });

  const isoCodes = providers.map(p => p.localities || []).flat();
  const countryService = CountryService();
  const countries = await countryService.getCountries({ isoCodes });
  
  return json({ serviceCentre, providers, count, offset, limit, search, sort, countries });
};

const Providers = () => {
  const { providers, count, offset, limit, search, sort, countries } = useLoaderData();

  const Context = (provider: Provider) => <ListContext select={true} />;

  const Item = (provider: Provider) =>
    <ListItem data={provider.name} sub={<Flags localities={provider.localities} countries={countries} />} />
  
  return (
    <>
      <Filter className="pt-6" filterTitle='Search providers' filterParam='q' allowSort={true} sort={sort} filter={search} />

      {count <= 0 && <Alert title={`No providers found ${search === null ? '' : `for ${search}`}`} level={Level.Warning} />}
      <List data={providers} renderItem={Item} renderContext={Context} buildTo={(props: any) => `/manage/providers/${props.item.id}/info`} />
      <Pagination entity='provider' totalItems={count} offset={offset} limit={limit} />
    </>
  );
};

export default Providers;
