import { useRef, useState, FormEvent } from 'react';
import { type ActionArgs, redirect, json, type LoaderArgs, type UploadHandler,
  unstable_composeUploadHandlers as composeUploadHandlers,
  unstable_createMemoryUploadHandler as createMemoryUploadHandler,
  unstable_parseMultipartFormData as parseMultipartFormData } from '@remix-run/node';
import { useActionData, useLoaderData } from '@remix-run/react'
import { Form, useFormContext, withZod, zfd, z } from '~/components/form';

import { IdentificationIcon } from '@heroicons/react/24/solid';
import { MapIcon } from '@heroicons/react/24/outline';

import { createSupabaseUploadHandler } from '~/services/supabase.server';
import { requireUser } from '~/auth/auth.server';

import ClientService, { create } from '~/services/manage/clients.server';
import SecurityGroupService, { type SecurityGroup } from '~/services/manage/security-groups.server';

import { UniqueInput, Cancel, Submit, Checkbox, Image,
         Body, Section, Group, Field, Footer, Lookup } from '~/components/form';
import { CountryFormManager, buildValidationError, changeCodes } from '~/components/countries/form';

import { RefSelectorModal, SelectorModal } from '~/components/manage/entity-selector';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import withAuthorization from '~/auth/with-authorization';
import { manage } from '~/auth/permissions';

export const handle = {
  name: "add-client",
  breadcrumb: ({ current, name }: BreadcrumbProps) => 
    <Breadcrumb to='/manage/clients/add' name={name} current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const url = new URL(request.url);
  const id = url.searchParams.get("security-group");

  const u = await requireUser(request);

  const service = SecurityGroupService(u);
  const securityGroup = id ? await service.getSecurityGroup({ id }) : undefined;

  return json({ securityGroup });
};

const schema = 
  zfd.formData({
    name: z
      .string()
      .nonempty("Client name is required")
      .min(3, "Client name must be at least 3 characters long"),
    identifier: z
      .string()
      .optional(),
    localities: z
      .object({
        id: z.string().or(z.array(z.string()))
      }),
    securityGroupId: z
      .string()
      .nonempty("The service centre is required"),
    logo: z.any(),
  });

export const clientValidator = withZod(schema);

export const action = async ({ request }: ActionArgs) => {
  const u = await requireUser(request);

  const uploadHandler: UploadHandler = composeUploadHandlers(
    createSupabaseUploadHandler({ bucket: "images" }),
    createMemoryUploadHandler()
  );

  const formData = await parseMultipartFormData(request, uploadHandler);

  if (formData.get('intent') === 'change-codes') {
    return json(await changeCodes(String(formData.get('codes'))));
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
    return buildValidationError(result.error, result.submittedData.localities);
  }

  const { data: { logo: { name: logo },
    localities: { id: codes }, identifier = "", ...data } } = result;
  const localities = Array.isArray(codes) === false ? [ codes ] as string[] : codes as string[];

  const service = ClientService(u);
  const client = await service.addClient(
    create({ logo, localities, identifier, ...data }));
  
  return client
    ? redirect(`/manage/clients/${client.id}/info`)
    : redirect(`/manage/clients`);
};

const Add = () => {
  const data = useActionData();
  const loaderData = useLoaderData();

  const [ autoGenerateIdentifier, setAutoGenerateIdentifier ] = useState(true);
  const [ securityGroup, setSecurityGroup ] = useState<SecurityGroup>(loaderData.securityGroup);

  const securityGroupModal = useRef<RefSelectorModal>(null);
  const showSecurityGroupModal = () => securityGroupModal.current?.show('security-group');

  const context = useFormContext("add-client");

  const handleAutoGenerate = (e: FormEvent<HTMLInputElement>) => {
    setAutoGenerateIdentifier(e.currentTarget.checked);
  };

  return (
    <>
      <Form method="post" validator={clientValidator} id="add-client" encType="multipart/form-data">
        <Body>
          <Section heading='New Client' explanation='Please enter the new client details.' />
          <Group>
            <Field>
              <UniqueInput label="Client Name" name="name" placeholder="e.g. Widget Inc"
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
            <Field>
              <Image label="Upload Logo" name="logo" accept="image/*" Icon={IdentificationIcon} />
            </Field>
            <Field span={3}>
              <Lookup label="Service Centre" name="securityGroupId" onClick={showSecurityGroupModal} 
                icon={MapIcon} value={securityGroup} placeholder="Select a Service Centre" />
            </Field>
          </Group>
          <CountryFormManager context={context} data={data} />
        </Body>
        <Footer>
          <Cancel />
          <Submit text="Save" submitting="Saving..." permission={manage.create.client} />
        </Footer>
      </Form>
      <SelectorModal ref={securityGroupModal} forAuthorization={false}
        onSelect={setSecurityGroup} allowChange={false} />
    </>
  );
}

export default withAuthorization(manage.create.securityGroup)(Add);