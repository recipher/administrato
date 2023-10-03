import { json, type LoaderArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import LegalEntityService from '~/models/manage/legal-entities.server';
import MilestoneService from '~/models/scheduler/milestones.server';

import { Breadcrumb } from "~/layout/breadcrumbs";

import { notFound, badRequest } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';

export const handle = {
  breadcrumb: ({ legalEntity, current }: { legalEntity: any, current: boolean }) => 
    <Breadcrumb to={`/manage/legal-entities/${legalEntity?.id}/milestones`} name="milestones" current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest('Invalid request');

  const u = await requireUser(request);

  const service = LegalEntityService(u);
  const legalEntity = await service.getLegalEntity({ id });

  const { milestoneSetId: setId } = legalEntity;

  const milestoneService = MilestoneService();
  const milestones = setId === null
    ? milestoneService.getDefaultSet()
    : milestoneService.getMilestonesBySet({ setId })

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
