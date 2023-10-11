import { json, type LoaderArgs } from '@remix-run/node';

import { badRequest } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';

import DocumentService from '~/services/manage/documents.server';

export const loader = async ({ request, params }: LoaderArgs) => {
  const { identifier, id: entityId, classifier } = params;
  if (entityId === undefined || identifier === undefined) return badRequest('Invalid data');

  const u = await requireUser(request);

  const service = DocumentService(u);
  const document = await service.getDocumentByIdentifierForEntityId({ entityId, identifier });

  return json({ document });
};

export default () => null;
