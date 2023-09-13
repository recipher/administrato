import { intlFormat } from 'date-fns';
import { useRef, useState } from 'react';
import { redirect, type LoaderArgs, type ActionArgs } from '@remix-run/node';
import { useLoaderData, useNavigate, useSearchParams, useSubmit } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

import { badRequest, notFound } from '~/utility/errors';
import { getCountry } from '~/models/countries.server';
import { listHolidaysByCountry, syncHolidays, deleteHolidayById, type Holiday } from '~/models/holidays.server';
import { getSession, storage } from '~/utility/flash.server';
import Alert, { Level } from '~/components/alert';
import ConfirmModal, { RefConfirmModal } from "~/components/modals/confirm";
import Tabs from '~/components/tabs';
import toNumber from '~/helpers/to-number';

import { ValidatedForm as Form, useFormContext, validationError } from 'remix-validated-form';
import { withZod } from '@remix-validated-form/with-zod';
import { zfd } from 'zod-form-data';
import { z } from 'zod';

import { Cancel, DatePicker, Input, Submit } from '~/components/form';

import { Breadcrumb } from "~/layout/breadcrumbs";
import { useLocale } from 'remix-i18next';

export const handle = {
  breadcrumb: ({ country, year, current }: { country: any, year: number, current: boolean }) => 
    <Breadcrumb to={`/holidays/${country?.isoCode}/add?year=${year}`} name="add" current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const url = new URL(request.url);
  const year = toNumber(url.searchParams.get("year") as string) || new Date().getFullYear();
  const { country: isoCode } = params;

  if (isoCode === undefined) return badRequest('Invalid request');

  const country = await getCountry({ isoCode });

  if (country === undefined) return notFound('Country not found');

  return { country, year };
};

export async function action({ request }: ActionArgs) {
  // let message;
  // const { intent, year, ...data } = await request.json();
  
  // if (intent === "remove") {
  //   const { holiday } = data;
  //   await deleteHolidayById(holiday.id);
  //   message = `Holiday Removed Successfully:${holiday.name}, ${year} has been removed.`;
  // };

  // if (intent === "sync") {
  //   const { country } = data;
  //   await syncHolidays({ year, locality: country.isoCode }, { shouldDelete: true });
  //   message = `Synchronization Successful:Holidays for ${country.name}, ${year} have been synchronized.`;
  // };
 
  // const session = await getSession(request);
  // session.flash("flash:text", message);
  // session.flash("flash:level", Level.Success);

  // return redirect(`?year=${year}`, {
  //   headers: { "Set-Cookie": await storage.commitSession(session) },
  //   status: 200,
  // });
};

export default function Add() {
  const { country, year } = useLoaderData();

  return (
    <>
      <Form method="post" id="add-service-centre" className="mt-5">
        <div className="space-y-12">
          <div className="grid grid-cols-1 gap-x-8 gap-y-10 border-b border-gray-900/10 pb-12 md:grid-cols-3">
            <div>
              <h2 className="text-lg font-semibold leading-7 text-gray-900">New Holiday for {country.name}</h2>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                Please enter the holiday information.
              </p>
            </div>

            <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-6 md:col-span-2">
              <div className="sm:col-span-4">
                <Input label="Holiday Name" name="name" placeholder="e.g. Christmas Day" />
              </div>
              <div className="sm:col-span-3">
                <DatePicker label="Holiday Date" placeholder="e.g. 25/12/2023" />
              </div>
            </div>
          </div>
        
          {/* <div className="grid grid-cols-1 gap-x-8 gap-y-10 border-b border-gray-900/10 pb-12 md:grid-cols-3">
            <div>
              <h3 className="text-base font-semibold leading-7 text-gray-900">
                Specify Countries or Regions
              </h3>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                Enter the countries to which the centre is associated, or select a specific region.
              </p>
            </div>

            <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2">
              <div className="sm:col-span-4">
                <Button title="Select a Country" 
                  icon={MagnifyingGlassIcon} 
                  type={ButtonType.Secondary} 
                  onClick={showCountriesModal} />

                {context.fieldErrors.localities && 
                  <p className="mt-2 text-sm text-red-600">
                    Please specify at least one country
                  </p>}
              </div>
              {data?.codes?.map((code: string) => {
                const country = findCountry(code);
                const regions = findRegions(code);
                return (
                  <div key={code} className="sm:col-span-4">
                    <Select 
                      label='Select Country or a Region'
                      name="localities" 
                      defaultValue={country}
                      data={[ country ].concat(regions)} />
                  </div>
                )})}
                </div> */}
          </div>
 
        <div className="mt-6 flex items-center justify-end gap-x-6">
          <Cancel />
          <Submit text="Save" submitting="Saving..." permission="manage:create:service-centre" />
        </div>
      </Form>
    </>
  );
}
