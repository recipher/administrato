import type { LoaderFunction, LoaderArgs } from "@remix-run/node";
import { requireUser } from "~/auth/auth.server";
import { badRequest, notFound } from "~/utility/errors";

import DocumentService from '~/services/manage/documents.server';

export const loader: LoaderFunction = async ({ request, params }: LoaderArgs) => {
  const u = await requireUser(request);

  const { id } = params;

  if (id === undefined) return badRequest('Invalid request');

  const service = DocumentService(u);
  const document = await service.getDocument({ id });

  if (document === undefined) return notFound('Document not found');

  const data = await fetch(document.document);
  const blob = await data.blob();

  return new Response(blob, {
    status: 200,
    headers: {
      'Content-Type': blob.type,
      'Content-Disposition': 'attachment'
    }
  });
};
