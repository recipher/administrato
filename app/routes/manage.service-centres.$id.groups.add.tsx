import { useState, FormEvent } from 'react';
import { type ActionArgs, redirect, json, LoaderArgs } from '@remix-run/node';
import { Form, useFormContext, withZod, zfd, z } from '~/components/form';

import ServiceCentreService, { create } from '~/services/manage/service-centres.server';
import { CountryFormManager, buildValidationError, changeCodes } from '~/components/countries/form';

import withAuthorization from '~/auth/with-authorization';
import { manage } from '~/auth/permissions';
import { requireUser } from '~/auth/auth.server';

import { badRequest, notFound } from '~/utility/errors';

import { UniqueInput, Cancel, Submit, Checkbox,
         Body, Section, Group, Field, Footer } from '~/components/form';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import { useActionData } from '@remix-run/react';

export const handle = {
  name: "add-group",
  breadcrumb: ({ serviceCentre, current, name }: { serviceCentre: any } & BreadcrumbProps) => 
    <Breadcrumb to={`/manage/service-centres/${serviceCentre.id}/groups/add`} name={name} current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest('Invalid request');

  const u = await requireUser(request);

  const service = ServiceCentreService(u);
  const serviceCentre = await service.getServiceCentre({ id });

  if (serviceCentre === undefined) return notFound('Service centre not found');

  return json({ serviceCentre });
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

  const u = await requireUser(request);
  const formData = await request.formData()

  if (formData.get('intent') === 'change-codes') {
    return json(await changeCodes(String(formData.get('codes'))));
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
  await service.addServiceCentre(create({ localities, identifier, parentId, ...data }));
  
  return redirect(`/manage/service-centres/${parentId}/groups`);
};

const AddGroup = () => {
  const data = useActionData();
  const [ autoGenerateIdentifier, setAutoGenerateIdentifier ] = useState(true);

  const context = useFormContext("add-service-centre-group");

  const handleAutoGenerate = (e: FormEvent<HTMLInputElement>) => {
    setAutoGenerateIdentifier(e.currentTarget.checked);
  };

  return (
    <>
      <Form method="post" validator={clientValidator} id="add-service-centre-group" className="mt-6">
        <Body>
          <Section heading='New Group' explanation='Please enter the new service centre group details.' />
          <Group>
            <Field>
              <UniqueInput label="Group Name" name="name" placeholder="e.g. Scotland"
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
          <CountryFormManager context={context} data={data} />
        </Body>
        <Footer>
          <Cancel />
          <Submit text="Save" submitting="Saving..." permission={manage.create.serviceCentre} />
        </Footer>
      </Form>
    </>
  );
}

export default withAuthorization(manage.edit.serviceCentre)(AddGroup);