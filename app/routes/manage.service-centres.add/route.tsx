import { ActionArgs, LoaderArgs, redirect } from '@remix-run/node';
import { useActionData, useLoaderData } from '@remix-run/react'
import { ValidatedForm as Form, validationError } from 'remix-validated-form';
import { withZod } from '@remix-validated-form/with-zod';
import { zfd } from 'zod-form-data';
import { z } from 'zod';
import { addServiceCentre } from '~/models/service-centres.server';
import { listCountries } from '~/models/countries.server';

import Input from '~/components/form/input';
import Combo from '~/components/form/combo';
import Cancel from '~/components/form/cancel';
import Submit from '~/components/form/submit';

export const loader = async ({ request }: LoaderArgs) => {
  const countries = await listCountries({ limit: 300 });

  return { countries };
};

export const validator = withZod(
//   z
//     .object({
//       name: z
//         .string()
//         .nonempty("Service Centre Name is required")
//         .min(3, "Service Centre Name must be at least 3 characters long"),
//       localities: z
//         .array(z.any())
//         .nonempty({ message: "Please select at least one country" })
//     })
  zfd.formData({
    name: z.string().nonempty("Service Centre Name is required").min(3, "Service Centre Name must be at least 3 characters long"),
    localities: zfd.repeatable(z.array(z.any()).min(1, "Please select at least one country")),
  })
);

export const action = async ({ request }: ActionArgs) => {
  const result = await validator.validate(await request.formData());

  if (result.error) return validationError(result.error);

  const { data: { localities, ...data } } = result;

  const serviceCentre = 
    await addServiceCentre({ localities: localities.map(l => l.id),  ...data });

  return redirect('/manage/service-centres');
};

export default function Add() {
  const { countries } = useLoaderData();
  const data = useActionData<typeof action>();

  const localities = countries.map((c: any) => ({ id: c.isoCode, name: c.name, image: `https://cdn.ipregistry.co/flags/twemoji/${c.isoCode.toLowerCase()}.svg` }));

  return (
    <Form method="post" validator={validator} id="add-service-centre">
      <div className="space-y-12">
        <div className="grid grid-cols-1 gap-x-8 gap-y-10 border-b border-gray-900/10 pb-12 md:grid-cols-3">
          <div>
            <h2 className="text-lg font-semibold leading-7 text-gray-900">New Service Centre</h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Please enter the new service centre details, specifying the countries to which the centre is associated.
            </p>
          </div>

          <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2">
            <div className="sm:col-span-4">
              <Input label="Service Centre Name" name="name" focus={true} placeholder="e.g. Scotland" />
              <Combo label="Countries" name="localities" data={localities} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-x-6">
        <Cancel />
        <Submit text="Save" submitting="Saving..." />
      </div>
    </Form>
  )
}
