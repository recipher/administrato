import { ActionArgs, json, redirect, type LoaderArgs } from '@remix-run/node';
import { useLoaderData, useNavigate, useSearchParams } from '@remix-run/react';

import { badRequest, notFound } from '~/utility/errors';

import ServiceCentreService from '~/models/manage/service-centres.server';
import CountryService, { Country } from '~/models/countries.server';
import HolidayService from '~/models/scheduler/holidays.server';

import { requireUser } from '~/auth/auth.server';
import { setFlashMessage, storage } from '~/utility/flash.server';

import HolidayList from '~/components/holidays/list';
import { Breadcrumb } from "~/layout/breadcrumbs";

import toNumber from '~/helpers/to-number';
import Tabs from '~/components/tabs';
import { Level } from '~/components/toast';

export const handle = {
  breadcrumb: ({ serviceCentre, current }: { serviceCentre: any, current: boolean }) => 
    <Breadcrumb to={`/manage/serviceCentres/${serviceCentre?.id}/holidays`} name="holidays" current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const url = new URL(request.url);
  const year = toNumber(url.searchParams.get("year") as string) || new Date().getFullYear();
  const isoCode = url.searchParams.get("locality");

  const { id } = params;

  if (id === undefined) return badRequest('Invalid request');

  const u = await requireUser(request);

  const service = ServiceCentreService(u);
  const serviceCentre = await service.getServiceCentre({ id });

  if (serviceCentre === undefined) return notFound('Service centre not found');
  if (!serviceCentre.localities?.length) return badRequest('Invalid service centre data');

  const countryService = CountryService();
  const countries = await countryService.getCountries({ isoCodes: serviceCentre.localities });

  const locality = (isoCode == null || serviceCentre.localities.includes(isoCode) === false)
    ? serviceCentre.localities?.at(0) : isoCode; 

  if (locality === undefined) return badRequest('Invalid service centre data');

  const holidayService = HolidayService();
  let holidays = await holidayService.listHolidaysByCountryForEntity({ locality, year, entity: 'service-centre', entityId: id });

  if (holidays.length === 0) {
    const synced = await holidayService.syncHolidays({ year, locality });
    if (synced !== undefined) holidays = synced;
  }

  return json({ serviceCentre, holidays, countries, locality, year });
};

export async function action({ request }: ActionArgs) {
  let message = "";
  const { intent, year, ...data } = await request.json();
  
  const service = HolidayService();

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
  const { serviceCentre, holidays, countries, locality, year } = useLoaderData();

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
      <HolidayList holidays={holidays} country={locality} year={year} entity={serviceCentre} entityType="service-centre" />
    </>
  );
};

export default Holidays;
