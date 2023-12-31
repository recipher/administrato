import { type ActionArgs, type LoaderArgs, redirect, json,
  unstable_composeUploadHandlers as composeUploadHandlers,
  unstable_createMemoryUploadHandler as createMemoryUploadHandler,
  unstable_parseMultipartFormData as parseMultipartFormData, type UploadHandler
  } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react'
import { validationError, withZod, z } from '~/components/form';

import { createSupabaseUploadHandler } from '~/services/supabase.server';
import { badRequest } from '~/utility/errors';

import DocumentService, { create } from '~/services/manage/documents.server';

import { requireUser } from '~/auth/auth.server';
import withAuthorization from '~/auth/with-authorization';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import DocumentForm, { getSchema } from '~/components/manage/document-form';
import { manage } from '~/auth/permissions';

export const handle = {
  name: 'add-document',
  path: 'add',
  breadcrumb: (props: BreadcrumbProps) => <Breadcrumb {...props} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const u = await requireUser(request);
  const { id, classifier } = params;

  if (id === undefined || classifier === undefined) return badRequest('Invalid data');

  const folders = await DocumentService(u).listFoldersByEntityId({ entityId: id });

  return json({ id, classifier, folders });
};

export const action = async ({ request, params }: ActionArgs) => {
  const u = await requireUser(request);

  const { id, classifier } = params;
  if (id === undefined || classifier === undefined) return badRequest('Invalid data');

  const uploadHandler: UploadHandler = composeUploadHandlers(
    createSupabaseUploadHandler({ bucket: "documents" }),
    createMemoryUploadHandler()
  );

  const formData = await parseMultipartFormData(request, uploadHandler);
  
  const validator = withZod(getSchema(z).and(z.object({ 
    document: z.object({ name: z.string(), type: z.string() }) }))
    .superRefine(
      async (data: any, ctx: any) => {
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
      })
  );

  const result = await validator.validate(formData);
  if (result.error) return validationError(result.error);

  const { data: { folder: { id: folder },
    document: { name: document, type: contentType }, ...data }} = result;

  const service = DocumentService(u);
  await service.addDocument(create({ entityId: id, folder, entity: classifier, document, contentType, ...data }));
  
  return redirect(`../?folder=${folder}`);
};

const Add = () => {
  const data = useLoaderData();

  return <DocumentForm {...data} permission={manage.edit.person}
    heading="Upload New Document" subHeading="Please enter the details of the new document to upload." />;
};

export default withAuthorization(manage.edit.person)(Add);