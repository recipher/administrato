import { ActionArgs, json, redirect, type LoaderArgs } from '@remix-run/node';
import { useLoaderData, useNavigate, useSearchParams } from '@remix-run/react';

import { badRequest, notFound } from '~/utility/errors';

import ClientService from '~/services/manage/clients.server';
import CountryService, { Country } from '~/services/countries.server';
import HolidayService from '~/services/scheduler/holidays.server';

import { requireUser } from '~/auth/auth.server';
import { setFlashMessage, storage } from '~/utility/flash.server';

import HolidayList from '~/components/holidays/list';
import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";

import toNumber from '~/helpers/to-number';
import Tabs from '~/components/tabs';
import { Level } from '~/components/toast';

export const handle = {
  name: "holidays",
  breadcrumb: ({ client, current, name }: { client: any } & BreadcrumbProps) => 
    <Breadcrumb to={`/manage/clients/${client?.id}/holidays`} name={name} current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const u = await requireUser(request);

  const url = new URL(request.url);
  const year = toNumber(url.searchParams.get("year") as string) || new Date().getFullYear();
  const isoCode = url.searchParams.get("locality");

  const { id } = params;
  if (id === undefined) return badRequest('Invalid request');

  const service = ClientService(u);
  const client = await service.getClient({ id });

  if (client === undefined) return notFound('Client not found');
  if (!client.localities?.length) return badRequest('Invalid client data');

  const countryService = CountryService();
  const countries = await countryService.getCountries({ isoCodes: client.localities });

  const locality = (isoCode == null || client.localities.includes(isoCode) === false)
    ? client.localities?.at(0) : isoCode; 

  if (locality === undefined) return badRequest('Invalid legal entity data');

  const holidayService = HolidayService(u);
  let holidays = await holidayService.listHolidaysByCountryForEntity({ locality, year, entityId: id });

  if (holidays.length === 0) {
    const synced = await holidayService.syncHolidays({ year, locality });
    if (synced !== undefined) holidays = synced;
  }

  return json({ client, holidays, countries, locality, year });
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
    const { holiday, entity: { id: entityId }} = data;
    await service.reinstateHolidayById(holiday.id, { entityId });
    message = `Holiday Reinstated Successfully:${holiday.name}, ${year} has been reinstated.`;
  };
 
  const session = await setFlashMessage({ request, message, level: Level.Success });
  return redirect(`?year=${year}`, {
    headers: { "Set-Cookie": await storage.commitSession(session) }});
};

const Holidays = () => {
  const { client, holidays, countries, locality, year } = useLoaderData();

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
      <HolidayList holidays={holidays} country={locality} year={year} entity={client} entityType="client" />
    </>
  );
};

export default Holidays;
