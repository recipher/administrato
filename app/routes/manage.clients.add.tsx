import { useEffect, useRef, useState, FormEvent } from 'react';
import { type ActionArgs, redirect, json, type LoaderArgs, type UploadHandler,
  unstable_composeUploadHandlers as composeUploadHandlers,
  unstable_createMemoryUploadHandler as createMemoryUploadHandler,
  unstable_parseMultipartFormData as parseMultipartFormData } from '@remix-run/node';
import { useActionData, useLoaderData, useSubmit } from '@remix-run/react'
import { useTranslation } from 'react-i18next';
import { ValidatedForm as Form, useFormContext, validationError } from 'remix-validated-form';
import { withZod } from '@remix-validated-form/with-zod';
import { zfd } from 'zod-form-data';
import { z } from 'zod';

import { IdentificationIcon } from '@heroicons/react/24/solid';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

import { createSupabaseUploadHandler } from '~/models/supabase.server';
import { requireUser } from '~/auth/auth.server';

import ClientService from '~/models/manage/clients.server';
import ServiceCentreService from '~/models/manage/service-centres.server';
import CountryService, { type Country } from '~/models/countries.server';

import { Input, UniqueInput, Select, Cancel, Submit, Checkbox, Image,
         Body, Section, Group, Field, Footer } from '~/components/form';

import type { RefModal } from '~/components/modals/modal';
import { CountriesModal } from '~/components/countries/countries';

import { Breadcrumb } from "~/layout/breadcrumbs";
import withAuthorization from '~/auth/with-authorization';
import { manage } from '~/auth/permissions';
import Button, { ButtonType } from '~/components/button';

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

const schema = 
  zfd.formData({
    name: z
      .string()
      .nonempty("Client name is required")
      .min(3, "Client name must be at least 3 characters long"),
    identifier: z
      .string()
      .optional(),
    localities: z
      .object({
        id: z.string().or(z.array(z.string()))
      }),
    serviceCentre: z
      .object({
        id: z
          .string()
          .transform(id => parseInt(id))
      }).required(),
    logo: z.any(),
  });

export const clientValidator = withZod(schema);

export const action = async ({ request }: ActionArgs) => {
  const countryService = CountryService();

  const u = await requireUser(request);

  const uploadHandler: UploadHandler = composeUploadHandlers(
    createSupabaseUploadHandler({ bucket: "images" }),
    createMemoryUploadHandler()
  );

  const formData = await parseMultipartFormData(request, uploadHandler);

  if (formData.get('intent') === 'change-codes') {
    const data = String(formData.get('codes'));
    if (data === "") return json({ codes: [], regions: [], countries: [] });
    const codes = data.split(',').reduce((codes: string[], code: string) => codes.includes(code) ? codes : [ ...codes, code ], []);
    const countries = await countryService.getCountries({ isoCodes: codes });
    const regions = await countryService.getRegions({ isoCodes: codes });
    return json({ codes, regions, countries });
  }

  const validator = withZod(schema.superRefine(
    async (data, ctx) => {
      const service = ClientService(u);
      if (data.identifier) {
        const client = await service.getClient({ id: data.identifier }, { bypassKeyCheck: true });
        if (client !== undefined) 
          ctx.addIssue({
            message: "This identifier is already in use",
            path: [ "identifier" ],
            code: z.ZodIssueCode.custom,
          });
      }
        if (data.name) {
          const client = await service.getClientByName({ name: data.name }, { bypassKeyCheck: true });
          if (client !== undefined) 
            ctx.addIssue({
              message: "This name is already in use",
              path: [ "name" ],
              code: z.ZodIssueCode.custom,
            });
        }
      }
  ));

  const result = await validator.validate(formData);
  if (result.error) { 
    const codes = [ result.submittedData.localities.isoCode ].flat();
    const countries = await countryService.getCountries({ isoCodes: codes });
    const regions = await countryService.getRegions({ isoCodes: codes });
    return { ...validationError(result.error), codes, countries, regions };
  }

  const { data: { serviceCentre: { id: serviceCentreId }, localities: { id: codes }, identifier = "", ...data } } = result;
  const localities = Array.isArray(codes) === false ? [ codes ] as string[] : codes as string[];

  const service = ClientService(u);
  const client = await service.addClient({ localities, serviceCentreId, identifier, ...data });
  
  return client
    ? redirect(`/manage/clients/${client.id}/info`)
    : redirect(`/manage/clients`);
};

const Add = () => {
  const { t } = useTranslation();
  const { serviceCentres, serviceCentre } = useLoaderData();

  const [ autoGenerateIdentifier, setAutoGenerateIdentifier ] = useState(true);

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

  const removeCountry = (country: Country) => {
    const codes = (data?.codes || []).filter((code: string) => code !== country.isoCode);
    submit({ intent: "change-codes", codes }, { method: "post", encType: "multipart/form-data" });  
  };

  useEffect(() => {
    context.validate();  // HACK :)
  }, [data])

  const handleAutoGenerate = (e: FormEvent<HTMLInputElement>) => {
    setAutoGenerateIdentifier(e.currentTarget.checked);
  };

  return (
    <>
      <Form method="post" validator={clientValidator} id="add-client" encType="multipart/form-data">
        <Body>
          <Section heading='New Client' explanation='Please enter the new client details.' />
          <Group>
            <Field>
              <UniqueInput label="Client Name" name="name" placeholder="e.g. Widget Inc"
                checkUrl="/manage/clients/name" property="client" message="This name is already in use" />
            </Field>
            <Field span={3}>
              <UniqueInput label="Identifier" name="identifier" 
                checkUrl="/manage/clients" property="client" message="This identifier is already in use"
                disabled={autoGenerateIdentifier} placeholder="leave blank to auto-generate" />
            </Field>
            <Field span={3}>
              <div className="pt-9">
                <Checkbox label="Auto-generate?" name="auto" checked={autoGenerateIdentifier} onChange={handleAutoGenerate} />
              </div>
            </Field>
            <Field>
              <Image label="Upload Logo" name="logo" accept="image/*" Icon={IdentificationIcon} />
            </Field>
            <Field>
              <Select data={serviceCentres} name="serviceCentre" label="Service Centre" defaultValue={serviceCentre} />
            </Field>
          </Group>
          <Section size="md" heading='Specify Countries or Regions' explanation='Enter the countries to which the centre is associated, or select a specific region.' />
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
                <>
                  <Field span={3} key={code}>
                    <Select 
                      label='Select Country or a Region'
                      name="localities" 
                      defaultValue={country}
                      data={[ country ].concat(regions)} />
                  </Field>
                  <Field span={1}>
                    <button onClick={() => removeCountry(country)}
                      type="button" className="text-sm mt-10 text-red-600 hover:text-red-500">
                      {t('remove')}
                    </button>
                  </Field>
                </>
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