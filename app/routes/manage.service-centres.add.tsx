import { useEffect, useState } from 'react';
import { ActionArgs, LoaderArgs, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react'
import { ValidatedForm as Form, validationError } from 'remix-validated-form';
import { withZod } from '@remix-validated-form/with-zod';
import { z } from 'zod';
import { zfd } from 'zod-form-data';
import { addServiceCentre } from '~/models/service-centres.server';
import { listCountries } from '~/models/countries.server';

import { Input, Select, Cancel, Submit } from '~/components/form';

import { Breadcrumb } from "~/layout/breadcrumbs";
import withAuthorization from '~/auth/with-authorization';

export const handle = {
  breadcrumb: ({ current }: { current: boolean }) => 
    <Breadcrumb to='/manage/service-centres/add' name="Add" current={current} />
};

export const loader = async ({ request }: LoaderArgs) => {
  const countries = await listCountries({ limit: 300 });

  return { countries, codes: [ "GB", "US" ] };
};

export const validator = withZod(
  zfd.formData({
    name: z
      .string()
      .nonempty("Service centre name is required")
      .min(3, "Service centre name must be at least 3 characters long"),
    localities: z
      .object({
        id: z.array(z.string())
      })
  })
);

export const action = async ({ request }: ActionArgs) => {
  const result = await validator.validate(await request.formData());

  if (result.error) return validationError(result.error);

  const { data: { localities: { id: localities }, ...data } } = result;

  const serviceCentre = await addServiceCentre({ localities,  ...data });

  return redirect('/manage/service-centres');
};

const Add = () => {
  const { countries, codes: c } = useLoaderData();
  const [ codes, setCodes ] = useState(c);
  const fetchers = codes.map((code: string) => ({ code, fetcher: useFetcher() }));

  useEffect(() => {
    fetchers.forEach(({ code, fetcher }: any) => {
      console.log(code)
      if (fetcher.state === "idle" && fetcher.data == null) {
        fetcher.load(`/holidays/${code}/regions`);
      }
    });
  }, [fetchers, codes]);

  const getFetcher = (code: string) => fetchers.find((fetcher: any) => code === fetcher.code);
  const localities = (countries: any) => countries.map((c: any) => ({ id: c.isoCode, name: c.name })); //, image: `https://cdn.ipregistry.co/flags/twemoji/${c.isoCode.toLowerCase()}.svg` }));

  return (
    <Form method="post" validator={validator} id="add-service-centre">
      <div className="space-y-12">
        <div className="grid grid-cols-1 gap-x-8 gap-y-10 border-b border-gray-900/10 pb-12 md:grid-cols-3">
          <div>
            <h2 className="text-lg font-semibold leading-7 text-gray-900">New Service Centre</h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Please enter the new service centre details.
            </p>
          </div>

          <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2">
            <div className="sm:col-span-4">
              <Input label="Service Centre Name" name="name" focus={true} placeholder="e.g. Scotland" />
            </div>
          </div>
        </div>
      
        <div className="grid grid-cols-1 gap-x-8 gap-y-10 border-b border-gray-900/10 pb-12 md:grid-cols-3">
          <div>
            <h3 className="text-base font-semibold leading-7 text-gray-900">
              Specify Countries or Regions
            </h3>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Enter the countries to which the centre is associated, or select a specific region.
            </p>
          </div>

          <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2">
            {codes.map((code: string) => {
              const fetcher = getFetcher(code)?.fetcher;
              return (
                <div key={code} className="sm:col-span-4">
                  {fetcher?.state === "idle" && fetcher?.data &&
                    <Select label={`Associated Countries ${code}`} name="localities" data={localities(fetcher.data.regions)} />
                  }
              </div>)
              })}
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-x-6">
        <Cancel />
        <Submit text="Save" submitting="Saving..." permission="manage:create:service-centre" />
      </div>
    </Form>
  )
}

export default withAuthorization("manage:create:service-centre")(Add);