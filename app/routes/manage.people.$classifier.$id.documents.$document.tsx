import { type ActionArgs, type LoaderArgs, redirect, json,
  unstable_composeUploadHandlers as composeUploadHandlers,
  unstable_createMemoryUploadHandler as createMemoryUploadHandler,
  unstable_parseMultipartFormData as parseMultipartFormData, type UploadHandler
  } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react'
import { validationError, withZod, z } from '~/components/form';

import { createSupabaseUploadHandler } from '~/services/supabase.server';
import { badRequest } from '~/utility/errors';

import DocumentService, { create, type Document } from '~/services/manage/documents.server';

import { requireUser } from '~/auth/auth.server';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import withAuthorization from '~/auth/with-authorization';
import { manage } from '~/auth/permissions';
import DocumentForm, { getSchema } from '~/components/manage/document-form';

export const handle = {
  name: ({ document }: { document: Document }) => document.identifier,
  path: ({ document }: { document: Document }) => document.id,
  breadcrumb: (props: BreadcrumbProps) => <Breadcrumb {...props} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const u = await requireUser(request);
  const { id, classifier, document: documentId } = params;

  if (id === undefined || classifier === undefined || documentId === undefined) 
    return badRequest('Invalid data');

  const service = DocumentService(u);
  const document = await service.getDocument({ id: documentId });
  const folders = await service.listFoldersByEntityId({ entityId: id });

  return json({ id, classifier, document, folders });
};

export const action = async ({ request, params }: ActionArgs) => {
  const u = await requireUser(request);

  const { id, classifier, document: documentId } = params;
  if (id === undefined || classifier === undefined || documentId === undefined) 
    return badRequest('Invalid data');

  const uploadHandler: UploadHandler = composeUploadHandlers(
    createSupabaseUploadHandler({ bucket: "documents" }),
    createMemoryUploadHandler()
  );

  const formData = await parseMultipartFormData(request, uploadHandler);
  
  const validator = withZod(getSchema(z).and(z.object({ 
    document: z.object({ name: z.string(), type: z.string() }).optional().or(z.string()) })));

  const result = await validator.validate(formData);
  if (result.error) return validationError(result.error);

  const { data: { document, folder: { id: folder }, ...data }} = result;

  const update = document // @ts-ignore
    ? { id: documentId, folder, document: document.name, contentType: document.type, ...data } 
    : { id: documentId, folder, ...data };
    
  await DocumentService(u).updateDocument(update);
  
  return redirect(`../?folder=${folder}`);
};

const Add = () => {
  const data = useLoaderData();

  return <DocumentForm {...data} permission={manage.edit.person}
    heading="Edit Document" subHeading="Please update the details of the document." />;
};

export default withAuthorization(manage.edit.person)(Add);