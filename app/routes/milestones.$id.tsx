import { json, type LoaderArgs } from '@remix-run/node';


import MilestoneService, { type MilestoneSet } from '~/models/scheduler/milestones.server';
import { badRequest } from '~/utility/errors';

export const loader = async ({ params, request }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest('Invalid data');

  const service = MilestoneService();

  const milestoneSet = await service.getMilestoneSetById({ id });

  return json({ milestoneSet });
};

export default function MilestoneSet() {
  return null;
}
