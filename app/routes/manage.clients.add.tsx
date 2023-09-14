import { useEffect, useRef } from 'react';
import { type ActionArgs, redirect, json, type LoaderArgs } from '@remix-run/node';
import { useActionData, useLoaderData, useSubmit } from '@remix-run/react'
import { ValidatedForm as Form, useFormContext, validationError } from 'remix-validated-form';
import { withZod } from '@remix-validated-form/with-zod';
import { zfd } from 'zod-form-data';
import { z } from 'zod';

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

import ClientService from '~/models/manage/clients.server';
import ServiceCentreService from '~/models/manage/service-centres.server';
import CountryService, { type Country } from '~/models/countries.server';

import { Input, Select, Cancel, Submit, 
         Body, Section, Group, Field, Footer } from '~/components/form';

import type { RefModal } from '~/components/modals/modal';
import { CountriesModal } from '~/components/countries/countries';

import { Breadcrumb } from "~/layout/breadcrumbs";
import withAuthorization from '~/auth/with-authorization';
import { manage } from '~/auth/permissions';
import Button, { ButtonType } from '~/components/button';
import { requireUser } from '~/auth/auth.server';

export const handle = {
  breadcrumb: ({ current }: { current: boolean }) => 
    <Breadcrumb to='/manage/clients/add' name="add-client" current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const url = new URL(request.url);
  const serviceCentreId = url.searchParams.get("service-centre");

  const u = await requireUser(request);

  const service = ServiceCentreService(u);
  const serviceCentres = await service.listServiceCentres();

  const serviceCentre = serviceCentres.find(sc => sc.id === serviceCentreId);

  return json({ serviceCentres, serviceCentre });
};

z.setErrorMap((issue, ctx) => {
  if (issue.code === "invalid_type") {
    if (issue.path.includes("serviceCentre"))
      return { message: "Service centre is required" };
  }
  return { message: ctx.defaultError };
});

export const validator = withZod(
  zfd.formData({
    name: z
      .string()
      .nonempty("Client name is required")
      .min(3, "Client name must be at least 3 characters long"),
    localities: z
      .object({
        id: z.string().or(z.array(z.string()))
      }),
    serviceCentre: z
      .object({
        id: z
          .string()
          .transform(id => parseInt(id))
      }).required()
  })
);

export const action = async ({ request }: ActionArgs) => {
  const u = await requireUser(request);
  const formData = await request.formData()

  if (formData.get('intent') === 'change-codes') {
    const service = CountryService();
    const codes = String(formData.get('codes')).split(',');
    const countries = await service.getCountries({ isoCodes: codes });
    const regions = await service.getRegions({ isoCodes: codes });
    return json({ codes, regions, countries });
  }

  const result = await validator.validate(formData);
  if (result.error) return validationError(result.error);

  const { data: { serviceCentre: { id: serviceCentreId }, localities: { id: codes }, ...data } } = result;
  const localities = Array.isArray(codes) === false ? [ codes ] as string[] : codes as string[];

  const service = ClientService(u);
  const client = await service.addClient({ localities, serviceCentreId, ...data });
  return redirect('/manage/clients');
};

const Add = () => {
  const { serviceCentres, serviceCentre } = useLoaderData();

  const data = useActionData();
  const submit = useSubmit();

  const context = useFormContext("add-client");
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
      <Form method="post" validator={validator} id="add-client">
        <Body>
          <Section heading='New Client' explanation='Please enter the new client details.' />
          <Group>
            <Field>
              <Input label="Client Name" name="name" placeholder="e.g. Widget Inc" />
            </Field>
            <Field>
              <Select data={serviceCentres} name="serviceCentre" label="Service Centre" defaultValue={serviceCentre} />
            </Field>
          </Group>
          <Section heading='Specify Countries or Regions' explanation='Enter the countries to which the centre is associated, or select a specific region.' />
          <Group>
            <Field>
              <Button title="Select a Country" 
                  icon={MagnifyingGlassIcon} 
                  type={ButtonType.Secondary} 
                  onClick={showCountriesModal} />

                {context.fieldErrors.localities && 
                  <p className="mt-2 text-sm text-red-600">
                    Please specify at least one country
                  </p>}
            </Field>

            {data?.codes?.map((code: string) => {
              const country = findCountry(code);
              const regions = findRegions(code);
              return (
                <Field key={code}>
                  <Select 
                    label='Select Country or a Region'
                    name="localities" 
                    defaultValue={country}
                    data={[ country ].concat(regions)} />
                </Field>
              )})}
          </Group>
        </Body>
        <Footer>
          <Cancel />
          <Submit text="Save" submitting="Saving..." permission={manage.create.client} />
        </Footer>
      </Form>
      <CountriesModal modal={modal} onSelect={selectCountry} />
    </>
  );
}

export default withAuthorization(manage.create.serviceCentre)(Add);