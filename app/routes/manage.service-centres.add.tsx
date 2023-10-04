import { useState, FormEvent } from 'react';
import { type ActionArgs, redirect, json } from '@remix-run/node';
import { ValidatedForm as Form, useFormContext, validationError } from 'remix-validated-form';
import { withZod } from '@remix-validated-form/with-zod';
import { zfd } from 'zod-form-data';
import { z } from 'zod';

import ServiceCentreService, { create } from '~/models/manage/service-centres.server';

import { UniqueInput, Cancel, Submit, Checkbox,
         Body, Section, Group, Field, Footer } from '~/components/form';

import { CountryFormManager, buildValidationError, changeCodes } from '~/components/countries/form';

import { requireUser } from '~/auth/auth.server';
import refreshUser from '~/auth/refresh.server';
import withAuthorization from '~/auth/with-authorization';

import { Breadcrumb } from "~/layout/breadcrumbs";
import { manage } from '~/auth/permissions';

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
  const u = await requireUser(request);
  const formData = await request.formData()

  if (formData.get('intent') === 'change-codes') {
    return json(await changeCodes(formData));
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
    return buildValidationError(result.error, result.submittedData.localities);
  }

  const { data: { localities: { id: codes }, identifier = "", ...data } } = result;
  const localities = Array.isArray(codes) === false ? [ codes ] as string[] : codes as string[];
  
  const service = ServiceCentreService(u);
  const serviceCentre = await service.addServiceCentre(create({ localities, identifier, ...data }));
  
  const headers = await refreshUser({ id: u.id, request });
  
  return serviceCentre
    ? redirect(`/manage/service-centres/${serviceCentre.id}/info`, { headers })
    : redirect(`/manage/service-centres`, { headers });
};

const Add = () => {
  const [ autoGenerateIdentifier, setAutoGenerateIdentifier ] = useState(true);

  const context = useFormContext("add-service-centre");

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
          <CountryFormManager context={context} />
        </Body>
        <Footer>
          <Cancel />
          <Submit text="Save" submitting="Saving..." permission={manage.create.serviceCentre} />
        </Footer>
      </Form>
    </>
  );
}

export default withAuthorization(manage.create.serviceCentre)(Add);