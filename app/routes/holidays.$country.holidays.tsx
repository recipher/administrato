import { intlFormat } from 'date-fns';
import { useRef, useState } from 'react';
import { redirect, type LoaderArgs, type ActionArgs } from '@remix-run/node';
import { useLoaderData, useNavigate, useSearchParams, useSubmit } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

import { badRequest, notFound } from '~/utility/errors';
import CountryService from '~/models/countries.server';
import HolidayService, { type Holiday } from '~/models/scheduler/holidays.server';
import { setFlashMessage, storage } from '~/utility/flash.server';
import Alert, { Level } from '~/components/alert';
import ConfirmModal, { RefConfirmModal } from "~/components/modals/confirm";
import Tabs from '~/components/tabs';
import toNumber from '~/helpers/to-number';

import { Breadcrumb } from "~/layout/breadcrumbs";
import { useLocale } from 'remix-i18next';

export const handle = {
  breadcrumb: ({ country, year, current }: { country: any, year: number, current: boolean }) => 
    <Breadcrumb to={`/holidays/${country?.isoCode}/holidays?year=${year}`} name="holidays" current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const url = new URL(request.url);
  const year = toNumber(url.searchParams.get("year") as string) || new Date().getFullYear();
  const { country: isoCode } = params;

  if (isoCode === undefined) return badRequest('Invalid request');

  const countryService = CountryService();
  const country = await countryService.getCountry({ isoCode });

  if (country === undefined) return notFound('Country not found');

  const holidayService = HolidayService();
  let holidays = await holidayService.listHolidaysByCountry({ locality: isoCode, year });

  if (holidays.length === 0) {
    const synced = await holidayService.syncHolidays({ year, locality: isoCode });
    if (synced !== undefined) holidays = synced;
  }

  return { holidays, country, year };
};

export async function action({ request }: ActionArgs) {
  let message = "";
  const { intent, year, ...data } = await request.json();
  
  const service = HolidayService();

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

const years = (year: number) => [...Array(5).keys()].map(index => year + index - 1);

export default function Holidays() {
  const locale = useLocale();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const submit = useSubmit();

  const confirm = useRef<RefConfirmModal>(null);
  const [ holiday, setHoliday ] = useState<Holiday>();
  
  const { holidays, country, year } = useLoaderData();

  const tabs = years(new Date().getUTCFullYear())
    .map((year: number) => ({ name: year.toString() }));

  const [ searchParams ] = useSearchParams();
  const qs = searchParams.toString() || '';
  const params = new URLSearchParams(qs);

  const onClick = (year: string ) => {
    params.set("year", year);
    navigate(`?${params.toString()}`);
  };

  const remove = (holiday: Holiday) => {
    setHoliday(holiday);
    confirm.current?.show("Remove this Holiday?", "Yes, Remove", "Cancel", `Are you sure you want to remove ${holiday.name}?`);
  };

  const onConfirmRemove = () => {
    if (holiday === undefined) return;
    submit({ intent: "remove", holiday: { id: holiday.id, name: holiday.name }, year }, 
      { method: "post", encType: "application/json" });  
  };

  return (
    <>
      {holidays.length === 0 && <Alert level={Level.Info} title={`No holidays for ${country.name}`} />}

      <Tabs tabs={tabs} selected={year} onClick={onClick} />

      <ul className="divide-y divide-gray-100">
        {holidays.map((holiday: any) => (
          <li key={holiday.id} className="group flex justify-between gap-x-6 py-3 hover:cursor-pointer">
            <div className="flex min-w-0 gap-x-4">
              <div className="min-w-0 flex-auto">
                <p className="text-md font-semibold leading-6 text-gray-900">
                  {holiday.name}
                </p>
                <p className="mt-1 flex text-xs leading-5 text-gray-500">
                  {intlFormat(new Date(holiday.date),
                    { year: 'numeric', month: 'long', day: 'numeric' }, { locale })}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-x-6">
              <div className="hidden group-hover:block">
                <button
                  type="button"
                  onClick={() => remove(holiday)}
                  className="inline-flex items-center gap-x-1.5 font-medium text-sm text-red-600 hover:text-red-500"
                >
                  {t('remove')}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <ConfirmModal ref={confirm} onYes={onConfirmRemove} />
    </>
  );
}
