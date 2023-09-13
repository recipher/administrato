import { redirect, type LoaderArgs, type ActionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import { badRequest, notFound } from '~/utility/errors';
import CountryService from '~/models/countries.server';
import HolidayService from '~/models/holidays.server';
import { setFlashMessage, storage } from '~/utility/flash.server';

import { ValidatedForm as Form, validationError } from 'remix-validated-form';
import { withZod } from '@remix-validated-form/with-zod';
import { zfd } from 'zod-form-data';
import { z } from 'zod';

import { Cancel, DatePicker, Input, Submit,
         Body, Section, Group, Field, Footer } from '~/components/form';

import { Breadcrumb } from "~/layout/breadcrumbs";
import { Level } from '~/components/toast';

export const handle = {
  breadcrumb: ({ country, year, current }: { country: any, year: number, current: boolean }) => 
    <Breadcrumb to={`/holidays/${country?.isoCode}/add?year=${year}`} name="add" current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { country: isoCode } = params;

  if (isoCode === undefined) return badRequest('Invalid request');

  const service = CountryService();
  const country = await service.getCountry({ isoCode });

  if (country === undefined) return notFound('Country not found');

  return { country };
};

export const validator = withZod(
  zfd.formData({
    name: z
      .string()
      .nonempty("Holiday name is required"),
    date: z
      .string()
      .nonempty('Holiday date is required')
      .transform(date => new Date(date))
    })
);

export async function action({ request, params }: ActionArgs) {
  const { country: isoCode } = params;

  if (isoCode === undefined) return badRequest('Invalid request');

  const formData = await request.formData();

  const result = await validator.validate(formData);
  if (result.error) return validationError(result.error);

  const year = result.data.date.getFullYear();

  let message = "", level = Level.Success;

  const { data: { name, date }} = result;

  try {
    const service = HolidayService();
    await service.addHoliday({ name, date, locality: isoCode });
    message = `Holiday Added Successfully:${name} was added to ${year}`;
  } catch(e: any) {
    message = `Holiday Add Error:${e.message}`;
    level = Level.Error;
  }

  const session = await setFlashMessage({ request, message, level });

  return redirect(`/holidays/${isoCode}/holidays?year=${year}`, {
    headers: { "Set-Cookie": await storage.commitSession(session) }
  });
};

export default function Add() {
  const { country } = useLoaderData();

  return (
    <Form method="post" validator={validator} id="add-service-centre" className="mt-5">
      <Body>
        <Section heading={`New Holiday for ${country.name}`} explanation='Please enter the holiday information.' />
        <Group>
          <Field>                
            <Input label="Holiday Name" name="name" placeholder="e.g. Christmas Day" />
          </Field>
          <Field>
            <DatePicker label="Holiday Date" placeholder="e.g. 25/12/2023" />
          </Field>
        </Group>
      </Body>
      <Footer>
        <Cancel />
        <Submit text="Save" submitting="Saving..." permission="manage:create:service-centre" />
      </Footer>
    </Form>
  );
}
