import { useState, FormEvent } from 'react';
import { type ActionArgs, redirect, json } from '@remix-run/node';

import SecurityGroupService, { create } from '~/services/manage/security-groups.server';

import { UniqueInput, Cancel, Submit, Checkbox,
         Body, Section, Group, Field, Footer,
         Form, useFormContext, withZod, zfd, z } from '~/components/form';

import { CountryFormManager, buildValidationError, changeCodes } from '~/components/countries/form';

import { requireUser } from '~/auth/auth.server';
import refreshUser from '~/auth/refresh.server';
import withAuthorization from '~/auth/with-authorization';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import { manage } from '~/auth/permissions';
import { useActionData } from '@remix-run/react';

export const handle = {
  name: "add-security-group",
  breadcrumb: ({ current, name }: BreadcrumbProps) => 
    <Breadcrumb to='/manage/security-groups/add' name={name} current={current} />
};

const schema = zfd.formData({
  name: z
    .string()
    .nonempty("Security group name is required")
    .min(3, "Security group name must be at least 3 characters long"),
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
  const formData = await request.formData();

  if (formData.get('intent') === 'change-codes') {
    return json(await changeCodes(String(formData.get('codes'))));
  }

  const validator = withZod(schema.superRefine(
    async (data, ctx) => {
      const service = SecurityGroupService(u);
      if (data.identifier) {
        const securityGroup = await service.getSecurityGroup({ id: data.identifier }, { bypassKeyCheck: true });
        if (securityGroup !== undefined) 
          ctx.addIssue({
            message: "This identifier is already in use",
            path: [ "identifier" ],
            code: z.ZodIssueCode.custom,
          });
      }
        if (data.name) {
          const securityGroup = await service.getSecurityGroupByName({ name: data.name }, { bypassKeyCheck: true });
          if (securityGroup !== undefined) 
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
  
  const service = SecurityGroupService(u);
  const securityGroup = await service.addSecurityGroup(create({ localities, identifier, ...data }));
  
  const headers = await refreshUser({ id: u.id, request });
  
  return securityGroup
    ? redirect(`/manage/security-groups/${securityGroup.id}/info`, { headers })
    : redirect(`/manage/security-groups`, { headers });
};

const Add = () => {
  const data = useActionData();
  const [ autoGenerateIdentifier, setAutoGenerateIdentifier ] = useState(true);

  const context = useFormContext("add-security-group");

  const handleAutoGenerate = (e: FormEvent<HTMLInputElement>) => {
    setAutoGenerateIdentifier(e.currentTarget.checked);
  };

  return (
    <>
      <Form method="post" validator={clientValidator} id="add-security-group">
        <Body>
          <Section heading='New Security Group' explanation='Please enter the new security group details.' />
          <Group>
            <Field>
              <UniqueInput label="Security Group Name" name="name" placeholder="e.g. Scotland"
                checkUrl="/manage/security-groups/name" property="securityGroup" message="This name is already in use" />
            </Field>
            <Field span={3}>
              <UniqueInput label="Identifier" name="identifier" 
                checkUrl="/manage/security-groups" property="securityGroup" message="This identifier is already in use"
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
          <Submit text="Save" submitting="Saving..." permission={manage.create.securityGroup} />
        </Footer>
      </Form>
    </>
  );
}

export default withAuthorization(manage.create.securityGroup)(Add);