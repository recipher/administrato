import { json, type LoaderArgs } from '@remix-run/node';

import { badRequest, notFound } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';

import SecurityGroupService from '~/services/manage/security-groups.server';

export const loader = async ({ request, params }: LoaderArgs) => {
  const { name } = params;

  if (name === undefined) return badRequest('Invalid request');

  const u = await requireUser(request);

  const service = SecurityGroupService(u);
  const securityGroup = await service.getSecurityGroupByName({ name }, { bypassKeyCheck: true });

  return json({ securityGroup });
};

export default () => null;
