import { json, type LoaderArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import ProviderService, { Provider } from '~/models/manage/providers.server';
import LegalEntityService, { LegalEntity } from '~/models/manage/legal-entities.server';
import CountryService from '~/models/countries.server';
import Alert, { Level } from '~/components/alert';
import { List, ListItem, ListContext } from '~/components/list';
import Pagination from '~/components/pagination';
import { Filter } from '~/components/header/advanced';
import { Flags } from '~/components/countries/flag';

import { Breadcrumb } from "~/layout/breadcrumbs";

import { notFound, badRequest } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';
import toNumber from '~/helpers/to-number';

const LIMIT = 6;

export const handle = {
  breadcrumb: ({ provider, current }: { provider: any, current: boolean }) => 
    <Breadcrumb to={`/manage/providers/${provider?.id}/legal-entities`} name="legal-entities" current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const url = new URL(request.url);
  const offset = toNumber(url.searchParams.get("offset") as string);
  const limit = toNumber(url.searchParams.get("limit") as string) || LIMIT;
  const search = url.searchParams.get("q");
  const sort = url.searchParams.get("sort");

  const { id } = params;

  if (id === undefined) return badRequest('Invalid request');

  const u = await requireUser(request);

  const service = ProviderService(u);
  const provider = await service.getProvider({ id });

  if (provider === undefined) return notFound('Provider not found');

  const legalEntityService = LegalEntityService(u);
  const { legalEntities, metadata: { count }} = 
    await legalEntityService.searchLegalEntities({ search, providerId: toNumber(id) }, { offset, limit, sortDirection: sort });

  const isoCodes = legalEntities.map(le => le.localities || []).flat();
  const countryService = CountryService();
  const countries = await countryService.getCountries({ isoCodes });
  
  return json({ provider, legalEntities, count, offset, limit, search, sort, countries });
};

const LegalEntities = () => {
  const { provider, legalEntities, count, offset, limit, search, sort, countries } = useLoaderData();

  const Context = (legalEntity: LegalEntity) =>
    <ListContext chevron={true} />;

  const Item = (legalEntity: LegalEntity) =>
    <ListItem data={legalEntity.name} sub={<Flags localities={legalEntity.localities} countries={countries} />} />
  
  return (
    <>
      <Filter className="pt-6" filterTitle='Search legal entities' filterParam='q' allowSort={true} sort={sort} filter={search} />

      {count <= 0 && <Alert title={`No legal entities found ${search === null ? '' : `for ${search}`}`} level={Level.Warning} />}
      <List data={legalEntities} renderItem={Item} renderContext={Context} buildTo={(props: any) => `/manage/legal-entities/${props.item.id}/info`} />
      <Pagination entity='legal-entity' totalItems={count} offset={offset} limit={limit} />
    </>
  );
};

export default LegalEntities;
