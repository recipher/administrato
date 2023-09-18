import { useEffect, useRef, useState, FormEvent } from 'react';
import { type ActionArgs, redirect, json } from '@remix-run/node';
import { useActionData, useSubmit } from '@remix-run/react'
import { ValidatedForm as Form, useFormContext, validationError } from 'remix-validated-form';
import { withZod } from '@remix-validated-form/with-zod';
import { zfd } from 'zod-form-data';
import { z } from 'zod';

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

import ServiceCentreService from '~/models/manage/service-centres.server';
import CountryService, { type Country } from '~/models/countries.server';

import { Input, UniqueInput, Select, Cancel, Submit, Checkbox,
         Body, Section, Group, Field, Footer } from '~/components/form';

import type { RefModal } from '~/components/modals/modal';
import { CountriesModal } from '~/components/countries/countries';

import { Breadcrumb } from "~/layout/breadcrumbs";
import withAuthorization from '~/auth/with-authorization';
import { manage } from '~/auth/permissions';
import Button, { ButtonType } from '~/components/button';
import { requireUser } from '~/auth/auth.server';
import refreshUser from '~/auth/refresh.server';

export const handle = {
  breadcrumb: ({ current }: { current: boolean }) => 
    <Breadcrumb to='/manage/service-centres/add' name="add-service-centre" current={current} />
};

const schema = zfd.formData({
  name: z
    .string()
    .nonempty("Service centre name is required")
    .min(3, "Service centre name must be at least 3 characters long"),
  identifier: z
    .string()
    .optional(),
  localities: z
    .object({
      id: z.string().or(z.array(z.string()))
    })
});

const clientValidator = withZod(schema);

export const action = async ({ request }: ActionArgs) => {
  const countryService = CountryService();

  const u = await requireUser(request);
  const formData = await request.formData()

  if (formData.get('intent') === 'change-codes') {
    const codes = String(formData.get('codes')).split(',');
    const countries = await countryService.getCountries({ isoCodes: codes });
    const regions = await countryService.getRegions({ isoCodes: codes });
    return json({ codes, regions, countries });
  }

  const validator = withZod(schema.superRefine(
    async (data, ctx) => {
      const service = ServiceCentreService(u);
      if (data.identifier) {
        const serviceCentre = await service.getServiceCentre({ id: data.identifier }, { bypassKeyCheck: true });
        if (serviceCentre !== undefined) 
          ctx.addIssue({
            message: "This identifier is already in use",
            path: [ "identifier" ],
            code: z.ZodIssueCode.custom,
          });
      }
        if (data.name) {
          const serviceCentre = await service.getServiceCentreByName({ name: data.name }, { bypassKeyCheck: true });
          if (serviceCentre !== undefined) 
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

  const { data: { localities: { id: codes }, identifier = "", ...data } } = result;
  const localities = Array.isArray(codes) === false ? [ codes ] as string[] : codes as string[];
  
  const service = ServiceCentreService(u);
  const serviceCentre = await service.addServiceCentre({ localities, identifier, ...data });
  
  const headers = await refreshUser({ id: u.id, request });
  
  return redirect('/manage/service-centres', { headers });
};

const Add = () => {
  const data = useActionData();
  const submit = useSubmit();

  const [ autoGenerateIdentifier, setAutoGenerateIdentifier ] = useState(true);

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
  }, [data]);

  const handleAutoGenerate = (e: FormEvent<HTMLInputElement>) => {
    setAutoGenerateIdentifier(e.currentTarget.checked);
  };

  return (
    <>
      <Form method="post" validator={clientValidator} id="add-service-centre">
        <Body>
          <Section heading='New Service Centre' explanation='Please enter the new service centre details.' />
          <Group>
            <Field>
              <UniqueInput label="Service Centre Name" name="name" placeholder="e.g. Scotland"
                checkUrl="/manage/service-centres/name" property="serviceCentre" message="This name is already in use" />
            </Field>
            <Field span={3}>
              <UniqueInput label="Identifier" name="identifier" 
                checkUrl="/manage/service-centres" property="serviceCentre" message="This identifier is already in use"
                disabled={autoGenerateIdentifier} placeholder="leave blank to auto-generate" />
            </Field>
            <Field span={3}>
              <div className="pt-9">
                <Checkbox label="Auto-generate?" name="auto" checked={autoGenerateIdentifier} onChange={handleAutoGenerate} />
              </div>
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
          <Submit text="Save" submitting="Saving..." permission={manage.create.serviceCentre} />
        </Footer>
      </Form>
      <CountriesModal modal={modal} onSelect={selectCountry} />
    </>
  );
}

export default withAuthorization(manage.create.serviceCentre)(Add);