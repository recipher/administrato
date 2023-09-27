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

import { CameraIcon } from '@heroicons/react/24/solid';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

import { createSupabaseUploadHandler } from '~/models/supabase.server';

import withAuthorization from '~/auth/with-authorization';
import { requireUser } from '~/auth/auth.server';

import ProviderService from '~/models/manage/providers.server';
import ServiceCentreService from '~/models/manage/service-centres.server';
import CountryService, { type Country } from '~/models/countries.server';

import { UniqueInput, Select, Cancel, Submit, Checkbox, Image, 
         Body, Section, Group, Field, Footer } from '~/components/form';

import type { RefModal } from '~/components/modals/modal';
import { CountriesModal } from '~/components/countries/countries';

import { Breadcrumb } from "~/layout/breadcrumbs";
import { manage } from '~/auth/permissions';
import Button, { ButtonType } from '~/components/button';

export const handle = {
  breadcrumb: ({ current }: { current: boolean }) => 
    <Breadcrumb to='/manage/providers/add' name="add-provider" current={current} />
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
      .nonempty("Provider name is required")
      .min(3, "Provider name must be at least 3 characters long"),
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

    const codes = data.split(',')
      .reduce((codes: string[], code: string) => 
        codes.includes(code) ? codes : [ ...codes, code ], []);
    
    const isoCodes = await countryService.getIsoCodes({ isoCodes: codes });
    const countries = await countryService.getCountries({ isoCodes });
    const regions = await countryService.getRegions({ isoCodes });

    return json({ codes, regions, countries });
  }

  const validator = withZod(schema.superRefine(
    async (data, ctx) => {
      const service = ProviderService(u);
      if (data.identifier) {
        const provider = await service.getProvider({ id: data.identifier }, { bypassKeyCheck: true });
        if (provider !== undefined) 
          ctx.addIssue({
            message: "This identifier is already in use",
            path: [ "identifier" ],
            code: z.ZodIssueCode.custom,
          });
      }
        if (data.name) {
          const provider = await service.getProviderByName({ name: data.name }, { bypassKeyCheck: true });
          if (provider !== undefined) 
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

  const service = ProviderService(u);
  const provider = await service.addProvider({ localities, serviceCentreId, identifier, ...data });
  
  return provider
    ? redirect(`/manage/providers/${provider.id}/info`)
    : redirect(`/manage/providers`);
};

const Add = () => {
  const { t } = useTranslation();
  const { serviceCentres, serviceCentre } = useLoaderData();

  const [ autoGenerateIdentifier, setAutoGenerateIdentifier ] = useState(true);

  const data = useActionData();
  const submit = useSubmit();

  const context = useFormContext("add-provider");
  const modal = useRef<RefModal>(null);

  const [ country, setCountry ] = useState<Country>();

  const findRegions = (code: string) => 
    data?.regions?.filter((r: Country) => r.parent === code)
      .map((r: Country) => ({ id: r.isoCode, ...r }));

  const findCountry = (code: string) => {
    const c = data?.countries?.find((c: Country) => c.isoCode === code);
    return c && { id: c.isoCode, ...c };
  };

  const findRegion = (code: string) => {
    const r = data?.regions?.find((c: Country) => c.isoCode === code);
    return r && { id: r.isoCode, ...r };
  };
        
  const showCountriesModal = () => {
    setCountry(undefined);
    modal.current?.show();
  };
  const showRegions = (country: Country) => {
    if (country === undefined) 
      showCountriesModal();
    else
      setCountry(country);
  };

  useEffect(() => {
    if (country) modal.current?.show();
  }, [country]);

  const selectCountry = (country: Country) => {
    const codes = data?.codes || [];
    submit({ intent: "change-codes", codes: [ ...codes, country.isoCode ] }, 
           { method: "post", encType: "multipart/form-data" });  
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
      <Form method="post" validator={clientValidator} id="add-provider" encType="multipart/form-data">
        <Body>
          <Section heading='New Provider' explanation='Please enter the new provider details.' />
          <Group>
            <Field>
              <UniqueInput label="Provider Name" name="name" placeholder="e.g. Processors Ltd"
                checkUrl="/manage/providers/name" property="provider" message="This name is already in use" />
            </Field>
            <Field span={3}>
              <UniqueInput label="Identifier" name="identifier" 
                checkUrl="/manage/providers" property="provider" message="This identifier is already in use"
                disabled={autoGenerateIdentifier} placeholder="leave blank to auto-generate" />
            </Field>
            <Field span={3}>
              <div className="pt-9">
                <Checkbox label="Auto-generate?" name="auto" checked={autoGenerateIdentifier} onChange={handleAutoGenerate} />
              </div>
            </Field>
            <Field>
              <Image label="Upload Logo" name="logo" accept="image/*" Icon={CameraIcon} />
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
              const region = findRegion(code);
              const isoCode = region ? region.parent : code;
              const country = findCountry(isoCode);
              const regions = findRegions(isoCode);
              return (
                <>
                  <Field span={3} key={code}>
                    <Select 
                      label='Select Country or a Region'
                      name="localities" 
                      defaultValue={region || country}
                      data={[ country ].concat(regions)} />
                  </Field>
                  <Field span={1}>
                    <button onClick={() => removeCountry(region || country)}
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
          <Submit text="Save" submitting="Saving..." permission={manage.create.provider} />
        </Footer>
      </Form>
      <CountriesModal modal={modal} country={country}
        onSelect={selectCountry} onSelectRegion={showRegions} />
    </>
  );
}

export default withAuthorization(manage.create.provider)(Add);