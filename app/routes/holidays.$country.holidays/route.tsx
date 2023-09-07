import { format } from 'date-fns';
import { useRef, useState } from 'react';
import { redirect, type LoaderArgs, type ActionArgs, json } from '@remix-run/node';
import { useLoaderData, useNavigate, useSearchParams, useSubmit } from '@remix-run/react';
import { XCircleIcon } from '@heroicons/react/20/solid';

import { badRequest, notFound } from '~/utility/errors';
import { getCountry } from '~/models/countries.server';
import { listHolidaysByCountry, syncHolidays, deleteHolidayById } from '~/models/holidays.server';
import { getSession, storage } from '~/utility/flash.server';
import Alert, { Level } from '~/components/alert';
import ConfirmModal, { RefConfirmModal } from "~/components/modals/confirm";
import Tabs from '~/components/tabs';
import toNumber from '~/helpers/to-number';

import { Breadcrumb } from "~/layout/breadcrumbs";

export const handle = {
  breadcrumb: ({ country, year, current }: { country: any, year: number, current: boolean }) => 
    <Breadcrumb to={`/holidays/${country?.isoCode}/holidays?year=${year}`} name="Holidays" current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const url = new URL(request.url);
  const year = toNumber(url.searchParams.get("year") as string) || new Date().getFullYear();
  const { country: isoCode } = params;

  if (isoCode === undefined) return badRequest('Invalid request');

  const country = await getCountry({ isoCode });

  if (country === undefined) return notFound('Country not found');

  let holidays = await listHolidaysByCountry({ locality: isoCode, year });

  if (holidays.length === 0) {
    const synced = await syncHolidays({ year, locality: isoCode });
    if (synced !== undefined) holidays = synced;
  }

  return { holidays, country, year };
};

export async function action({ request }: ActionArgs) {
  let message;
  const { intent, year, ...data } = await request.json();
  
  if (intent === "remove") {
    const { holiday } = data;
    await deleteHolidayById(holiday.id);
    message = `Holiday Removed Successfully:${holiday.name}, ${year} has been removed`;
  };

  if (intent === "sync") {
    const { country } = data;
    await syncHolidays({ year, locality: country.isoCode }, { shouldDelete: true });
    message = `Synchronization Successful:Holidays for ${country.name}, ${year} has been synchronized`;
  };
 
  const session = await getSession(request);
  session.flash("flashText", message);
  session.flash("flashLevel", Level.Success);

  return redirect(`?year=${year}`, {
    headers: { "Set-Cookie": await storage.commitSession(session) },
    status: 200,
  });
};

const years = (year: number) => [...Array(5).keys()].map(index => year + index - 1);

export default function Holidays() {
  const navigate = useNavigate();
  const submit = useSubmit();
  const confirm = useRef<RefConfirmModal>(null);
  const [ holiday, setHoliday ] = useState<{ name: string, id: number}>();
  
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

  const remove = (name: string, id: number) => {
    setHoliday({ name, id });
    confirm.current?.show("Remove this Holiday?", "Yes, Remove", "Cancel", `Are you sure you want to remove ${name}?`);
  };

  const onConfirmRemove = () => {
    if (holiday === undefined) return;
    submit({ intent: "remove", holiday, year }, { method: "post", encType: "application/json" });  
  };

  return (
    <>
      {holidays.length === 0 && <Alert level={Level.Info} title={`No holidays for ${country.name}`} />}

      <Tabs tabs={tabs} selected={year} onClick={onClick} />

      <ul role="list" className="divide-y divide-gray-100">
        {holidays.map((holiday: any) => (
          <li key={holiday.id} className="group flex justify-between gap-x-6 py-3 hover:cursor-pointer">
            <div className="flex min-w-0 gap-x-4">
              <div className="min-w-0 flex-auto">
                <p className="text-md font-semibold leading-6 text-gray-900">
                  {holiday.name}
                </p>
                <p className="mt-1 flex text-xs leading-5 text-gray-500">
                  {format(new Date(holiday.date), 'do MMMM yyyy')}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-x-6">
              <div className="hidden group-hover:block">
                <button
                  type="button"
                  onClick={() => remove(holiday.name, holiday.id)}
                  className="inline-flex items-center gap-x-1.5 rounded-md bg-red-50 px-2.5 py-1.5 text-sm font-semibold text-red-600 shadow-sm hover:bg-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                >
                  <XCircleIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
                  remove
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
