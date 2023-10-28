import { json, type LoaderArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import LegalEntityService from '~/services/manage/legal-entities.server';
import MilestoneService from '~/services/scheduler/milestones.server';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";

import { notFound, badRequest } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';

export const handle = {
  name: "milestones",
  breadcrumb: (props: BreadcrumbProps) => <Breadcrumb {...props} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const u = await requireUser(request);

  const { id } = params;

  if (id === undefined) return badRequest('Invalid request');

  const service = LegalEntityService(u);
  const legalEntity = await service.getLegalEntity({ id });

  const { milestoneSetId: setId } = legalEntity;

  const milestoneService = MilestoneService(u);
  const milestones = setId === null
    ? milestoneService.listMilestonesByDefaultSet()
    : milestoneService.listMilestonesBySet({ setId })

  if (legalEntity === undefined) return notFound('Legal entity not found');

  return json({ legalEntity, milestones });
};

const Milestones = () => {
  const { legalEntity } = useLoaderData();

  return (
    <div></div>
  );
};

export default Milestones;
