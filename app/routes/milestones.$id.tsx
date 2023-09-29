import { json, type LoaderArgs } from '@remix-run/node';
import { Outlet, useLoaderData } from '@remix-run/react';

import { badRequest } from '~/utility/errors';

import MilestoneService, { type MilestoneSet } from '~/models/scheduler/milestones.server';
import Header from '~/components/header';
import { Breadcrumb } from "~/layout/breadcrumbs";

import { scheduler } from '~/auth/permissions';

export const handle = {
  breadcrumb: ({ milestoneSet, current }: { milestoneSet: any, current: boolean }) => 
    <Breadcrumb to={`/milestones/${milestoneSet.id}`} name={milestoneSet.identifier} current={current} />
};

export const loader = async ({ params, request }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest('Invalid data');

  const service = MilestoneService();
  const milestoneSet = await service.getMilestoneSetById({ id });

  return json({ milestoneSet });
};

export default function MilestoneSet() {
  const { milestoneSet: { id, identifier }} = useLoaderData();

  const actions = [
    { title: 'add-milestone', to: `/milestones/${id}/add`, permission: scheduler.edit.milestone },
  ];

  return (
    <>
      <Header title={identifier} actions={actions} />
      <Outlet />
    </>
  );
};