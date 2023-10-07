import { json, type LoaderArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import ServiceCentreService from '~/models/manage/service-centres.server';
import LegalEntityService, { LegalEntity } from '~/models/manage/legal-entities.server';
import CountryService from '~/models/countries.server';
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
  name: "legal-entities",
  breadcrumb: ({ serviceCentre, current, name }: { serviceCentre: any } & BreadcrumbProps) => 
    <Breadcrumb to={`/manage/service-centres/${serviceCentre?.id}/legal-entities`} name={name} current={current} />
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

  const legalEntityService = LegalEntityService(u);
  const { legalEntities, metadata: { count }} = 
    await legalEntityService.searchLegalEntities({ search, 
      serviceCentreId: all ? undefined : id,
      serviceCentre: all ? serviceCentre : undefined
    }, { offset, limit, sortDirection: sort });

  const isoCodes = legalEntities.map(le => le.localities || []).flat();
  const countryService = CountryService();
  const countries = await countryService.getCountries({ isoCodes });
  
  return json({ serviceCentre, legalEntities, count, offset, limit, search, sort, countries });
};

const LegalEntities = () => {
  const { serviceCentre, legalEntities, count, offset, limit, search, sort, countries } = useLoaderData();

  const Context = (legalEntity: LegalEntity) => <ListContext select={true} />;

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
