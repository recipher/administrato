import { useEffect, useRef } from 'react';
import { ActionArgs, redirect, json } from '@remix-run/node';
import { useActionData, useSubmit } from '@remix-run/react'
import { ValidatedForm as Form, useFormContext, validationError } from 'remix-validated-form';
import { withZod } from '@remix-validated-form/with-zod';
import { zfd } from 'zod-form-data';
import { z } from 'zod';

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

import { addServiceCentre } from '~/models/service-centres.server';
import { getCountries, getRegions, type Country } from '~/models/countries.server';

import { Input, Select, Cancel, Submit } from '~/components/form';
import { RefModal } from '~/components/modals/modal';
import { CountriesModal } from '~/components/countries/countries';

import { Breadcrumb } from "~/layout/breadcrumbs";
import withAuthorization from '~/auth/with-authorization';
import { manage } from '~/auth/permissions';
import Button, { ButtonType } from '~/components/button';

export const handle = {
  breadcrumb: ({ current }: { current: boolean }) => 
    <Breadcrumb to='/manage/service-centres/add' name="add-service-centre" current={current} />
};

export const validator = withZod(
  zfd.formData({
    name: z
      .string()
      .nonempty("Service centre name is required")
      .min(3, "Service centre name must be at least 3 characters long"),
    localities: z
      .object({
        id: z.string().or(z.array(z.string()))
      })
  })
);

export const action = async ({ request }: ActionArgs) => {
  const formData = await request.formData()

  if (formData.get('intent') === 'change-codes') {
    const codes = String(formData.get('codes')).split(',');
    const countries = await getCountries({ isoCodes: codes });
    const regions = await getRegions({ isoCodes: codes });
    return json({ codes, regions, countries });
  }

  const result = await validator.validate(formData);
  if (result.error) return validationError(result.error);

  const { data: { localities: { id: codes }, ...data } } = result;
  const localities = Array.isArray(codes) === false ? [ codes ] as string[] : codes as string[];
  const serviceCentre = await addServiceCentre({ localities, ...data });
  return redirect('/manage/service-centres');
};

const Add = () => {
  const data = useActionData();
  const submit = useSubmit();

  const context = useFormContext("add-service-centre");
  const modal = useRef<RefModal>(null);

  const findRegions = (code: string) => 
    data?.regions?.filter((r: Country) => r.parent === code)
    .map((r: Country) => ({ id: r.isoCode, ...r }));

  const findCountry = (code: string) => {
    const c = data?.countries?.find((c: Country) => c.isoCode === code);
    return { id: c.isoCode, ...c };
  };

  const showCountriesModal = () => modal.current?.show();

  const selectCountry = (country: Country) => {
    const codes = data?.codes || [];
    submit({ intent: "change-codes", codes: [ ...codes, country.isoCode ] }, { method: "post", encType: "multipart/form-data" });  
  };

  useEffect(() => {
    context.validate();  // HACK :)
  }, [data])

  return (
    <>
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
                <Input label="Service Centre Name" name="name" placeholder="e.g. Scotland" />
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
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-x-6">
          <Cancel />
          <Submit text="Save" submitting="Saving..." permission="manage:create:service-centre" />
        </div>
      </Form>

      <CountriesModal modal={modal} onSelect={selectCountry} />
    </>
  );
}

export default withAuthorization(manage.create.serviceCentre)(Add);