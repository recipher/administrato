import { json, type LoaderArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { PlusIcon } from '@heroicons/react/20/solid';

import ServiceCentreService, { type ServiceCentre } from '~/models/manage/service-centres.server';
import LegalEntityService, { type LegalEntity } from '~/models/manage/legal-entities.server';
import CountryService from '~/models/countries.server';

import Header from "~/components/header";
import Alert, { Level } from '~/components/alert';
import { requireUser } from '~/auth/auth.server';

import { manage } from '~/auth/permissions';
import { Flags } from '~/components/countries/flag';
import Pagination from '~/components/pagination';
import { List, ListItem, ListContext } from '~/components/list';
import toNumber from '~/helpers/to-number';

const LIMIT = 6;

export const loader = async ({ request }: LoaderArgs) => {
  const url = new URL(request.url);
  const offset = toNumber(url.searchParams.get("offset") as string);
  const limit = toNumber(url.searchParams.get("limit") as string) || LIMIT;
  const search = url.searchParams.get("q");
  const sort = url.searchParams.get("sort");
  const serviceCentreId = url.searchParams.get("service-centre");

  const u = await requireUser(request);

  const serviceCentreService = ServiceCentreService(u);
  const serviceCentres = await serviceCentreService.listServiceCentres();
  const serviceCentre = serviceCentreId ? serviceCentres.find((sc: ServiceCentre) => sc.id === serviceCentreId) : undefined;

  const service = LegalEntityService(u);
  const { legalEntities, metadata: { count }} = 
    await service.searchLegalEntities({ search, serviceCentre }, { offset, limit, sortDirection: sort });

  const isoCodes = legalEntities.map((le: LegalEntity) => le.localities || []).flat();
  const countryService = CountryService();
  const countries = await countryService.getCountries({ isoCodes });

  return json({ legalEntities, countries, count, offset, limit, search, serviceCentres, serviceCentreId });
};

export default function LegalEntities() {
  const { legalEntities, countries, count, offset, limit, search, serviceCentres, serviceCentreId } = useLoaderData();

  const filter = {
    title: "Select Service Centre",
    filterParam: "service-centre",
    selected: serviceCentreId,
    filters: serviceCentres.map((s: ServiceCentre) => ({ name: s.name, value: s.id }))
  };
  
  const Context = (legalEntity: LegalEntity) =>
    <ListContext data={legalEntity.serviceCentre} sub={legalEntity.provider} select={false} />;

  const Item = (legalEntity: LegalEntity) =>
    <ListItem data={legalEntity.name} sub={<Flags localities={legalEntity.localities} countries={countries} />} />

  return (
    <>
      <Header title="legal-entities" additionalFilters={filter}
        filterTitle='Search legal entities' filterParam='q' allowSort={true} />

      {count <= 0 && <Alert title={`No legal entities found ${search === null ? '' : `for ${search}`}`} level={Level.Warning} />}
      <List data={legalEntities} renderItem={Item} renderContext={Context} />
      <Pagination entity='legal-entity' totalItems={count} offset={offset} limit={limit} />
    </>
  );
}
