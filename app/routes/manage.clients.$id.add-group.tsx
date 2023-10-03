import { useEffect, useRef, useState, FormEvent } from 'react';
import { type ActionArgs, redirect, json, LoaderArgs } from '@remix-run/node';
import { useActionData, useSubmit } from '@remix-run/react'
import { useTranslation } from 'react-i18next';
import { ValidatedForm as Form, useFormContext, validationError } from 'remix-validated-form';
import { withZod } from '@remix-validated-form/with-zod';
import { zfd } from 'zod-form-data';
import { z } from 'zod';

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

import ClientService from '~/models/manage/clients.server';
import CountryService, { type Country } from '~/models/countries.server';

import withAuthorization from '~/auth/with-authorization';
import { manage } from '~/auth/permissions';
import { requireUser } from '~/auth/auth.server';

import { badRequest, notFound } from '~/utility/errors';

import { UniqueInput, Select, Cancel, Submit, Checkbox,
         Body, Section, Group, Field, Footer } from '~/components/form';

import type { RefModal } from '~/components/modals/modal';
import { CountriesModal } from '~/components/countries/countries';

import { Breadcrumb } from "~/layout/breadcrumbs";
import Button, { ButtonType } from '~/components/button';
import toNumber from '~/helpers/to-number';

export const handle = {
  breadcrumb: ({ client, current }: { client: any, current: boolean }) => 
    <Breadcrumb to={`/manage/clients/${client.id}/groups/add`} name="add-group" current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest('Invalid request');

  const u = await requireUser(request);

  const service = ClientService(u);
  const client = await service.getClient({ id });

  if (client === undefined) return notFound('Client not found');

  return json({ client });
};

const schema = zfd.formData({
  name: z
    .string()
    .nonempty("Group name is required")
    .min(3, "Group name must be at least 3 characters long"),
  identifier: z
    .string()
    .optional(),
  localities: z
    .object({
      id: z.string().or(z.array(z.string()))
    })
});

const clientValidator = withZod(schema);

export const action = async ({ request, params }: ActionArgs) => {
  const parentId = params.id;

  if (parentId === undefined) return badRequest('Invalid data');

  const countryService = CountryService();

  const u = await requireUser(request);
  const formData = await request.formData()

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

  const { data: { localities: { id: codes }, identifier = "", ...data } } = result;
  const localities = Array.isArray(codes) === false ? [ codes ] as string[] : codes as string[];
  
  const service = ClientService(u);
  const parent = await service.getClient({ id: parentId });
  await service.addClient({ localities, identifier, parentId, serviceCentreId: parent.serviceCentreId, ...data });
  
  return redirect(`/manage/clients/${parentId}/groups`);
};

const AddGroup = () => {
  const { t } = useTranslation();
  const data = useActionData();
  const submit = useSubmit();

  const [ autoGenerateIdentifier, setAutoGenerateIdentifier ] = useState(true);

  const context = useFormContext("add-client-group");
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
  }, [data]);

  const handleAutoGenerate = (e: FormEvent<HTMLInputElement>) => {
    setAutoGenerateIdentifier(e.currentTarget.checked);
  };

  return (
    <>
      <Form method="post" validator={clientValidator} id="add-client-group" className="mt-6">
        <Body>
          <Section heading='New Group' explanation='Please enter the new client group details.' />
          <Group>
            <Field>
              <UniqueInput label="Group Name" name="name" placeholder="e.g. Scotland"
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
          </Group>
          <Section size="md" heading='Specify Countries or Regions' explanation='Enter the countries to which the group is associated, or select a specific region.' />
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
          <Submit text="Save" submitting="Saving..." permission={manage.create.client} />
        </Footer>
      </Form>
      <CountriesModal modal={modal} country={country}
        onSelect={selectCountry} onSelectRegion={showRegions} />
    </>
  );
}

export default withAuthorization(manage.edit.serviceCentre)(AddGroup);