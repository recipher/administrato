import { json, type LoaderArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { PlusIcon } from '@heroicons/react/20/solid';

import ServiceCentreService, { type ServiceCentre } from '~/services/manage/service-centres.server';
import LegalEntityService, { type LegalEntity } from '~/services/manage/legal-entities.server';
import CountryService from '~/services/countries.server';

import Header from "~/components/header";
import Alert, { Level } from '~/components/alert';
import { requireUser } from '~/auth/auth.server';

import { Flags } from '~/components/countries/flag';
import Pagination from '~/components/pagination';
import { List, ListItem, ListContext } from '~/components/list';
import { scheduler } from '~/auth/permissions';
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

const actions = [
  { title: "generate-schedules", to: "generate", icon: PlusIcon, permission: scheduler.create.schedule },
];

export default function Schedules() {
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
      <Header title="legal-entities" additionalFilters={filter} actions={actions}
        filterTitle='Search legal entities' filterParam='q' allowSort={true} />

      {count <= 0 && <Alert title={`No legal entities found ${search === null ? '' : `for ${search}`}`} level={Level.Warning} />}
      <List data={legalEntities} renderItem={Item} renderContext={Context} />
      <Pagination entity='legal-entity' totalItems={count} offset={offset} limit={limit} />
    </>
  );
}
