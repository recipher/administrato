import { json, type LoaderArgs } from '@remix-run/node';
import { Outlet, useLoaderData } from '@remix-run/react';

import { PlusIcon } from '@heroicons/react/24/outline';

import { badRequest } from '~/utility/errors';

import { requireUser } from '~/auth/auth.server';

import MilestoneService, { type MilestoneSet } from '~/services/scheduler/milestones.server';
import Header from '~/components/header';
import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";

import { scheduler } from '~/auth/permissions';

export const handle = {
  name: ({ milestoneSet }: { milestoneSet: any }) => milestoneSet?.identifier,
  breadcrumb: ({ milestoneSet, current, name }: { milestoneSet: any } & BreadcrumbProps) => 
    <Breadcrumb to={`/milestones/${milestoneSet?.id}`} name={name} current={current} />
};

export const loader = async ({ params, request }: LoaderArgs) => {
  const u = await requireUser(request);
  
  const { id } = params;

  if (id === undefined) return badRequest('Invalid data');

  const service = MilestoneService(u);
  const milestoneSet = await service.getMilestoneSetById({ id });

  return json({ milestoneSet });
};

export default function MilestoneSet() {
  const { milestoneSet: { id, identifier }} = useLoaderData();

  const actions = [
    { title: 'add-milestone', icon: PlusIcon, to: `/milestones/${id}/add`, permission: scheduler.edit.milestone },
  ];

  return (
    <>
      <Header title={identifier} actions={actions} />
      <Outlet />
    </>
  );
};