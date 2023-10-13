import { type ActionArgs, type LoaderArgs, redirect, json, //type UploadHandler,
  unstable_composeUploadHandlers as composeUploadHandlers,
  unstable_createMemoryUploadHandler as createMemoryUploadHandler,
  unstable_parseMultipartFormData as parseMultipartFormData, type UploadHandler
  } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react'
import { Form, validationError, withZod, zfd, z } from '~/components/form';
import { useTranslation } from 'react-i18next';

import { DocumentArrowUpIcon } from '@heroicons/react/24/outline';

import { createSupabaseUploadHandler } from '~/services/supabase.server';
import { badRequest } from '~/utility/errors';

import { Classifier } from '~/services/manage/people.server';
import DocumentService, { create } from '~/services/manage/documents.server';

import { requireUser } from '~/auth/auth.server';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import withAuthorization from '~/auth/with-authorization';
import { manage } from '~/auth/permissions';

import { Input, UniqueInput, Cancel, Submit, File,
  Body, Section, Group, Field, Footer } from '~/components/form';

export const handle = {
  name: 'add-document',
  breadcrumb: ({ id, classifier, current, name }: { id: string, classifier: Classifier } & BreadcrumbProps) => 
    <Breadcrumb to={`/manage/people/${classifier}/${id}/add-document`} name={name} current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id, classifier } = params;

  if (id === undefined || classifier === undefined) return badRequest('Invalid data');

  return json({ id, classifier });
};

const schema = zfd.formData({
  identifier: z
    .string()
    .nonempty("Document name is required"),
  folder: z
    .string()
    .nonempty("Folder name is required"),
  document: z.any()
});

const clientValidator = withZod(schema);

export const action = async ({ request, params }: ActionArgs) => {
  const u = await requireUser(request);

  const { id, classifier } = params;
  if (id === undefined || classifier === undefined) return badRequest('Invalid data');

  const uploadHandler: UploadHandler = composeUploadHandlers(
    createSupabaseUploadHandler({ bucket: "documents" }),
    createMemoryUploadHandler()
  );

  const formData = await parseMultipartFormData(request, uploadHandler);
  
  const validator = withZod(schema.superRefine(
    async (data, ctx) => {
      const service = DocumentService(u);
      if (data.identifier) {
        const document = await service.getDocumentByIdentifierForEntityId({ entityId: id, identifier: data.identifier });
        if (document !== undefined) 
          ctx.addIssue({
            message: "A document with this name already exists",
            path: [ "identifier" ],
            code: z.ZodIssueCode.custom,
          });
      }
    }
  ));

  const result = await validator.validate(formData);
  if (result.error) return validationError(result.error);

  const { data } = result;

  const service = DocumentService(u);
  const document = await service.addDocument(create({ entityId: id, entity: classifier, ...data }));
  
  return redirect('../documents');
};

const Add = () => {
  const { t } = useTranslation();
  const { classifier, id } = useLoaderData();

  return (
    <>
      <Form method="post" validator={clientValidator} id="add-document" encType="multipart/form-data" className="mt-5">
        <Body>
          <Section heading='New Document' explanation='Please enter the new document details.' />
          <Group>
            <Field>
              <UniqueInput label="Document Name" name="identifier"
                checkUrl={`/manage/people/${classifier}/${id}/documents`} property="document" message="A document with this name already exists" />
            </Field>
            <Field>
              <Input label="Folder Name" name="folder" />
            </Field>
            <Field>
              <File label="Upload Document" name="document" accept="*/*" Icon={DocumentArrowUpIcon} />
            </Field>
          </Group>
        </Body>
        <Footer>
          <Cancel />
          <Submit text="Save" submitting="Saving..." permission={manage.create.worker} />
        </Footer>
      </Form>
    </>
  );
}

export default withAuthorization(manage.edit.worker)(Add);