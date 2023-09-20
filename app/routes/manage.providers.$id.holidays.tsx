import { json, type LoaderArgs } from '@remix-run/node';
import { useLoaderData, useNavigate, useSearchParams } from '@remix-run/react';

import { badRequest, notFound } from '~/utility/errors';

import ProviderService from '~/models/manage/providers.server';
import CountryService, { Country } from '~/models/countries.server';
import HolidayService from '~/models/scheduler/holidays.server';

import { requireUser } from '~/auth/auth.server';

import HolidayList from '~/components/holidays/list';
import { Breadcrumb } from "~/layout/breadcrumbs";

import toNumber from '~/helpers/to-number';
import Tabs from '~/components/tabs';

export const handle = {
  breadcrumb: ({ provider, current }: { provider: any, current: boolean }) => 
    <Breadcrumb to={`/manage/providers/${provider?.id}/holidays`} name="holidays" current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const url = new URL(request.url);
  const year = toNumber(url.searchParams.get("year") as string) || new Date().getFullYear();
  const isoCode = url.searchParams.get("locality");

  const id = toNumber(params.id as string);

  if (id === undefined) return badRequest('Invalid request');

  const u = await requireUser(request);

  const service = ProviderService(u);
  const provider = await service.getProvider({ id });

  if (provider === undefined) return notFound('Provider not found');
  if (!provider.localities?.length) return badRequest('Invalid provider data');

  const countryService = CountryService();
  const countries = await countryService.getCountries({ isoCodes: provider.localities });

  const locality = (isoCode == null || provider.localities.includes(isoCode) === false)
    ? provider.localities?.at(0) : isoCode; 

  if (locality === undefined) return badRequest('Invalid provider data');

  const holidayService = HolidayService();
  let holidays = await holidayService.listHolidaysByCountryForEntity({ locality, year, entity: 'provider', entityId: id });

  if (holidays.length === 0) {
    const synced = await holidayService.syncHolidays({ year, locality });
    if (synced !== undefined) holidays = synced;
  }

  return json({ provider, holidays, countries, locality, year });
};

const Holidays = () => {
  const { provider, holidays, countries, locality, year } = useLoaderData();

  const tabs = countries.map((country: Country) => 
    ({ name: country.name, value: country.isoCode }));

  const navigate = useNavigate();
  const [ searchParams ] = useSearchParams();

  const handleClick = (locality: string ) => {
    searchParams.set("locality", locality);
    navigate(`?${searchParams.toString()}`);
  };
  
  return (
    <>
      <Tabs tabs={tabs} selected={locality} onClick={handleClick} />
      <HolidayList holidays={holidays} country={locality} year={year} />
    </>
  );
};

export default Holidays;
