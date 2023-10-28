import { redirect, type LoaderArgs, type ActionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

import { CurrencyYenIcon, IdentificationIcon, WalletIcon, MapIcon } from '@heroicons/react/24/outline';

import { badRequest, notFound } from '~/utility/errors';
import CountryService from '~/services/countries.server';
import HolidayService, { create } from '~/services/scheduler/holidays.server';
import ProviderService, { Provider } from '~/services/manage/providers.server';
import ClientService, { Client } from '~/services/manage/clients.server';
import LegalEntityService, { LegalEntity } from '~/services/manage/legal-entities.server';
import SecurityGroupService, { SecurityGroup } from '~/services/manage/security-groups.server';
import { setFlashMessage, storage } from '~/utility/flash.server';

import { requireUser } from '~/auth/auth.server';

import { Form, validationError, withZod, zfd, z,
         Cancel, DatePicker, Input, Submit,
         Body, Section, Group, Field, Footer, Lookup } from '~/components/form';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import { Level } from '~/components/toast';
import toNumber from '~/helpers/to-number';
import pluralize from '~/helpers/pluralize';

export const handle = {
  name: "add-holiday",
  breadcrumb: ({ country, year, ...props }: { country: any, year: number } & BreadcrumbProps) => 
    <Breadcrumb to={`/holidays/${country?.isoCode}/add?year=${year}`} {...props} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const u = await requireUser(request);
  const url = new URL(request.url);
  const year = toNumber(url.searchParams.get("year") as string) || new Date().getFullYear();
  const { country: isoCode } = params;

  const entityType = url.searchParams.get("entity") || null;
  const entityId = url.searchParams.get("entity-id") as string;

  if (isoCode === undefined) return badRequest('Invalid request');

  const service = CountryService();
  const country = await service.getCountry({ isoCode });

  if (country === undefined) return notFound('Country not found');

  let entity;
  if (entityId) {
    switch(entityType) {
      case "client":
        entity = await (ClientService(u)).getClient({ id: entityId });
        break;
      case "legal-entity":
        entity = await (LegalEntityService(u)).getLegalEntity({ id: entityId });
        break;
      case "provider":
        entity = await (ProviderService(u)).getProvider({ id: entityId });
        break;
      case "security-group":
        entity = await (SecurityGroupService(u)).getSecurityGroup({ id: entityId });
        break;
    }
  }

  return { country, year, entityType, entity };
};

z.setErrorMap((issue, ctx) => {
  if (issue.code === "invalid_date") {
    if (issue.path.includes("date"))
      return { message: "Holiday date is required" };
  }
  return { message: ctx.defaultError };
});

export const validator = withZod(
  zfd.formData({
    name: z
      .string()
      .nonempty("Holiday name is required"),
    date: z
      .coerce.date(),
    entityId: z
      .string()
      .optional()
    })
);

export async function action({ request, params }: ActionArgs) {
  const u = await requireUser(request);

  const url = new URL(request.url);
  const entity = url.searchParams.get("entity") || null;

  const { country: isoCode } = params;

  if (isoCode === undefined) return badRequest('Invalid request');

  const formData = await request.formData();

  const result = await validator.validate(formData);
  if (result.error) return validationError(result.error);

  const year = result.data.date.getFullYear();

  let message = "", level = Level.Success;

  const { data: { name, date, entityId }} = result;

  try {
    const service = HolidayService(u);
    await service.addHoliday(create({ name, date, locality: isoCode, entity, entityId: entityId || null }));
    message = `Holiday Added Successfully:${name} was added to ${year}`;
  } catch(e: any) {
    message = `Holiday Add Error:${e.message}`;
    level = Level.Error;
  }

  const session = await setFlashMessage({ request, message, level });

  const redirectTo = entity
    ? `/manage/${pluralize(entity)}/${entityId}/holidays?year=${year}`
    : `/holidays/${isoCode}/holidays?year=${year}`;
  return redirect(redirectTo, {
    headers: { "Set-Cookie": await storage.commitSession(session) }
  });
};

export default function Add() {
  const { t } = useTranslation();
  const { country, year, entity, entityType } = useLoaderData();

  const date = new Date();
  date.setFullYear(year);

  const noOp = () => null!
  
  const icons = new Map<string, any>([
    [ "security-group", MapIcon ],
    [ "client", IdentificationIcon ],
    [ "legal-entity", WalletIcon ],
    [ "provider", CurrencyYenIcon ],
  ]);

  const icon = entityType && icons.get(entityType);

  return (
    <>
      <Form method="post" validator={validator} id="add-holiday" className="mt-6">
        <Body>
          <Section heading={`New Holiday for ${country.name}`} explanation='Please enter the holiday information.' />
          <Group>
            <Field>                
              <Input label="Holiday Name" name="name" placeholder="e.g. Christmas Day" />
            </Field>
            <Field>
              <DatePicker label="Holiday Date" placeholder="e.g. 25/12/2023" defaultValue={date}  />
            </Field>
          </Group>
          {entity && <>
            <Section size="md" heading={`Selected ${t(entityType)}`} explanation={`You are adding this holiday specifically for this ${t(entityType)}.`} />
              <Group>
                <Field span={3}>
                  <Lookup label={t(entityType)} name="entityId" onClick={noOp} 
                    value={entity} placeholder={`Selected ${t(entityType)}`} icon={icon} />
                </Field>
              </Group>
            </>}
        </Body>
        <Footer>
          <Cancel />
          <Submit text="Save" submitting="Saving..." permission="manage:create:security-group" />
        </Footer>
      </Form>
    </>
  );
}
