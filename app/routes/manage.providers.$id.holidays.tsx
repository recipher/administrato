import { ActionArgs, json, redirect, type LoaderArgs } from '@remix-run/node';
import { useLoaderData, useNavigate, useSearchParams } from '@remix-run/react';

import { badRequest, notFound } from '~/utility/errors';

import ProviderService from '~/models/manage/providers.server';
import CountryService, { Country } from '~/models/countries.server';
import HolidayService from '~/models/scheduler/holidays.server';

import { requireUser } from '~/auth/auth.server';
import { setFlashMessage, storage } from '~/utility/flash.server';

import HolidayList from '~/components/holidays/list';
import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";

import toNumber from '~/helpers/to-number';
import Tabs from '~/components/tabs';
import { Level } from '~/components/toast';

export const handle = {
  name: () => "holidays",
  breadcrumb: ({ provider, current, name }: { provider: any } & BreadcrumbProps) => 
    <Breadcrumb to={`/manage/providers/${provider?.id}/holidays`} name={name} current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const u = await requireUser(request);

  const url = new URL(request.url);
  const year = toNumber(url.searchParams.get("year") as string) || new Date().getFullYear();
  const isoCode = url.searchParams.get("locality");

  const { id } = params;

  if (id === undefined) return badRequest('Invalid request');

  const service = ProviderService(u);
  const provider = await service.getProvider({ id });

  if (provider === undefined) return notFound('Provider not found');
  if (!provider.localities?.length) return badRequest('Invalid provider data');

  const countryService = CountryService();
  const countries = await countryService.getCountries({ isoCodes: provider.localities });

  const locality = (isoCode == null || provider.localities.includes(isoCode) === false)
    ? provider.localities?.at(0) : isoCode; 

  if (locality === undefined) return badRequest('Invalid provider data');

  const holidayService = HolidayService(u);
  let holidays = await holidayService.listHolidaysByCountryForEntity({ locality, year, entity: 'provider', entityId: id });

  if (holidays.length === 0) {
    const synced = await holidayService.syncHolidays({ year, locality });
    if (synced !== undefined) holidays = synced;
  }

  return json({ provider, holidays, countries, locality, year });
};

export async function action({ request }: ActionArgs) {
  const u = await requireUser(request);

  let message = "";
  const { intent, year, ...data } = await request.json();
  
  const service = HolidayService(u);

  if (intent === "remove") {
    const { holiday, entity: { id: entityId, type: entity }} = data;
    await service.deleteHolidayById(holiday.id, { entity, entityId });
    message = `Holiday Removed Successfully:${holiday.name}, ${year} has been removed.`;
  };

  if (intent === "reinstate") {
    const { holiday, entity: { id: entityId, type: entity }} = data;
    await service.reinstateHolidayById(holiday.id, { entity, entityId });
    message = `Holiday Reinstated Successfully:${holiday.name}, ${year} has been reinstated.`;
  };
 
  const session = await setFlashMessage({ request, message, level: Level.Success });
  return redirect(`?year=${year}`, {
    headers: { "Set-Cookie": await storage.commitSession(session) }});
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
      <HolidayList holidays={holidays} country={locality} year={year} entity={provider} entityType="provider" />
    </>
  );
};

export default Holidays;
