import { useEffect, useRef, useState, FormEvent } from 'react';
import { type ActionArgs, redirect, json, type LoaderArgs } from '@remix-run/node';
import { useActionData, useLoaderData, useSubmit } from '@remix-run/react'
import { ValidatedForm as Form, useFormContext, validationError } from 'remix-validated-form';
import { withZod } from '@remix-validated-form/with-zod';
import { zfd } from 'zod-form-data';
import { z } from 'zod';

import { IdentificationIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

import LegalEntityService, { frequencies } from '~/models/manage/legal-entities.server';
import ServiceCentreService from '~/models/manage/service-centres.server';
import CountryService, { type Country } from '~/models/countries.server';
import { type Provider } from '~/models/manage/providers.server';

import { requireUser } from '~/auth/auth.server';

import { UniqueInput, Select, Cancel, Submit, Checkbox,
         Body, Section, Group, Field, Footer, Lookup } from '~/components/form';

import type { RefModal } from '~/components/modals/modal';
import { CountriesModal } from '~/components/countries/countries';
import { RefSelectorModal, SelectorModal } from '~/components/manage/selector';

import { Breadcrumb } from "~/layout/breadcrumbs";
import withAuthorization from '~/auth/with-authorization';
import { manage } from '~/auth/permissions';
import Button, { ButtonType } from '~/components/button';
import { useTranslation } from 'react-i18next';

export const handle = {
  i18n: "schedule",
  breadcrumb: ({ current }: { current: boolean }) => 
    <Breadcrumb to='/manage/legal-entities/add' name="add-legal-entity" current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const url = new URL(request.url);
  const serviceCentreId = url.searchParams.get("service-centre");

  const u = await requireUser(request);

  const service = ServiceCentreService(u);
  const serviceCentres = await service.listServiceCentres();

  const serviceCentre = serviceCentres.find(sc => sc.id === serviceCentreId);

  return json({ serviceCentres, serviceCentre, frequencies });
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
      .nonempty("Legal entity name is required")
      .min(3, "Legal entity name must be at least 3 characters long"),
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
    providerId: z
      .string()
      .nonempty("The provider is required"),
    });

export const clientValidator = withZod(schema);

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
      const service = LegalEntityService(u);
      if (data.identifier) {
        const legalEntity = await service.getLegalEntity({ id: data.identifier }, { bypassKeyCheck: true });
        if (legalEntity !== undefined) 
          ctx.addIssue({
            message: "This identifier is already in use",
            path: [ "identifier" ],
            code: z.ZodIssueCode.custom,
          });
      }
        if (data.name) {
          const legalEntity = await service.getLegalEntityByName({ name: data.name }, { bypassKeyCheck: true });
          if (legalEntity !== undefined) 
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

  const service = LegalEntityService(u);
  // @ts-ignore
  const legalEntity = await service.addLegalEntity({ localities, serviceCentreId, identifier, ...data });
  
  return legalEntity
    ? redirect(`/manage/legal-entities/${legalEntity.id}/info`)
    : redirect(`/manage/legal-entities`);
};

const Add = () => {
  const { t } = useTranslation("schedule");
  const { serviceCentres, serviceCentre, frequencies } = useLoaderData();

  const [ autoGenerateIdentifier, setAutoGenerateIdentifier ] = useState(true);
  const [ provider, setProvider ] = useState<Provider>();

  const data = useActionData();
  const submit = useSubmit();

  const context = useFormContext("add-legal-entity");
  const modal = useRef<RefModal>(null);

  const providerModal = useRef<RefSelectorModal>(null);

  const showProviderModal = () => providerModal.current?.show('provider');

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

  const handleAutoGenerate = (e: FormEvent<HTMLInputElement>) => {
    setAutoGenerateIdentifier(e.currentTarget.checked);
  };

  return (
    <>
      <Form method="post" validator={clientValidator} id="add-legal-entity">
        <Body>
          <Section heading='New Legal Entity' explanation='Please enter the new legal entity details.' />
          <Group>
          <Field>
              <UniqueInput label="Legal Entity Name" name="name" placeholder="e.g. Recipher Scotland"
                checkUrl="/manage/legal-entities/name" property="legalEntity" message="This name is already in use" />
            </Field>
            <Field span={3}>
              <UniqueInput label="Identifier" name="identifier" 
                checkUrl="/manage/legal-entities" property="legalEntity" message="This identifier is already in use"
                disabled={autoGenerateIdentifier} placeholder="leave blank to auto-generate" />
            </Field>
            <Field>
              <Select label="Schedule Frequency" name="frequency" data={frequencies?.map((f: string) => ({ id: f, name: t(f) }))} />
            </Field>
            <Field span={3}>
              <div className="pt-9">
                <Checkbox label="Auto-generate?" name="auto" checked={autoGenerateIdentifier} onChange={handleAutoGenerate} />
              </div>
            </Field>
            <Field>
              <Select data={serviceCentres} name="serviceCentre" label="Service Centre" defaultValue={serviceCentre} />
            </Field>
          </Group>
          <Section size="md" />
          <Group>
            <Field span={3}>
              <Lookup label="Provider" name="providerId" onClick={showProviderModal} 
                icon={IdentificationIcon} value={provider} placeholder="Select a Provider" />
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
          <Submit text="Save" submitting="Saving..." permission={manage.create.legalEntity} />
        </Footer>
      </Form>
      <CountriesModal modal={modal} onSelect={selectCountry} />
      <SelectorModal ref={providerModal} onSelect={setProvider} allowChange={false} />
    </>
  );
}

export default withAuthorization(manage.create.legalEntity)(Add);