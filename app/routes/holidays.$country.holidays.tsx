import { redirect, type LoaderArgs, type ActionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import { badRequest, notFound } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';

import CountryService from '~/models/countries.server';
import HolidayService from '~/models/scheduler/holidays.server';
import { setFlashMessage, storage } from '~/utility/flash.server';
import { Level } from '~/components/alert';
import toNumber from '~/helpers/to-number';
import HolidayList from '~/components/holidays/list';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";

export const handle = {
  name: "holidays",
  breadcrumb: ({ country, year, current, name }: { country: any, year: number } & BreadcrumbProps) => 
    <Breadcrumb to={`/holidays/${country?.isoCode}/holidays?year=${year}`} name={name} current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const u = await requireUser(request);

  const url = new URL(request.url);
  const year = toNumber(url.searchParams.get("year") as string) || new Date().getFullYear();
  const { country: isoCode } = params;

  if (isoCode === undefined) return badRequest('Invalid request');

  const countryService = CountryService();
  const country = await countryService.getCountry({ isoCode });

  if (country === undefined) return notFound('Country not found');

  const holidayService = HolidayService(u);
  let holidays = await holidayService.listHolidaysByCountry({ locality: isoCode, year });

  if (holidays.length === 0) {
    const synced = await holidayService.syncHolidays({ year, locality: isoCode });
    if (synced !== undefined) holidays = synced;
  }

  return { holidays, country, year };
};

export async function action({ request }: ActionArgs) {
  const u = await requireUser(request);

  let message = "";
  const { intent, year, ...data } = await request.json();
  
  const service = HolidayService(u);

  if (intent === "remove") {
    const { holiday } = data;
    await service.deleteHolidayById(holiday.id);
    message = `Holiday Removed Successfully:${holiday.name}, ${year} has been removed.`;
  };

  if (intent === "sync") {
    const { country } = data;
    await service.syncHolidays({ year, locality: country.isoCode }, { shouldDelete: true });
    message = `Synchronization Successful:Holidays for ${country.name}, ${year} have been synchronized.`;
  };
 
  const session = await setFlashMessage({ request, message, level: Level.Success });
  return redirect(`?year=${year}`, {
    headers: { "Set-Cookie": await storage.commitSession(session) }});
};

export default function Holidays() {
  const { holidays, country, year } = useLoaderData();

  return <HolidayList holidays={holidays} country={country} year={year} />
}
