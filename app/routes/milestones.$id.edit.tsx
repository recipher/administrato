import { useState, useRef } from 'react';
import { ActionArgs, json, redirect, type LoaderArgs } from '@remix-run/node';
import { useLoaderData, useSubmit } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

import { badRequest } from '~/utility/errors';

import { requireUser } from '~/auth/auth.server';

import MilestoneService, { type Milestone } from '~/services/scheduler/milestones.server';
import Alert, { Level } from '~/components/alert';

import { Table } from '~/components';

import ConfirmModal, { type RefConfirmModal } from "~/components/modals/confirm";
import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import { setFlashMessage, storage } from '~/utility/flash.server';

import classnames from '~/helpers/classnames';
import pluralize from '~/helpers/pluralize';

export const handle = {
  name: "edit",
  breadcrumb: ({ milestoneSet, current, name }: { milestoneSet: any } & BreadcrumbProps) => 
    <Breadcrumb to={`/milestones/${milestoneSet.id}/edit`} name={name} current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const u = await requireUser(request);

  const { id } = params;

  if (id === undefined) return badRequest('Invalid data');

  const service = MilestoneService(u);
  const milestoneSet = await service.getMilestoneSetById({ id });
  const milestones = await service.listMilestonesBySet({ setId: id });

  return json({ milestoneSet, milestones });
};

export const action = async ({ request, params }: ActionArgs) => {
  const u = await requireUser(request);
  const service = MilestoneService(u);

  let message = "", level = Level.Success;
  const { intent, milestone: { id, identifier, ...milestone }} = await request.json();

  if (intent === 'remove-milestone') {
    try {
      await service.removeMilestone({ id });
      message = `Milestone Removed:Milestone ${identifier} has been removed.`;
    } catch(e: any) {
      message = `Milestone Remove Error:${e.message}.`;
      level = Level.Error;
    };
  }

  if (intent === 'change-index') {
    try {
      milestone.direction > 0
        ? await service.increaseMilestoneIndex({ id })
        : await service.decreaseMilestoneIndex({ id })        
    } catch(e: any) {
      message = `Milestone Move Error:${e.message}.`;
      level = Level.Error;
    };
  }
  
  const session = await setFlashMessage({ request, message, level });
  return redirect(".", { headers: { "Set-Cookie": await storage.commitSession(session) } });
};

export default function MilestoneSets() {
  const { t } = useTranslation();
  const submit = useSubmit();
 
  const { milestones } = useLoaderData();
  const maxIndex = milestones.reduce((max: number, milestone: Milestone) => {
    return (milestone.index || 0) > max ? milestone.index : max;
  }, 0);

  const [ milestone, setMilestone ] = useState<Milestone>();
  
  const confirm = useRef<RefConfirmModal>(null);

  const handleRemove = (ms: Milestone) => {
    setMilestone(ms);
    confirm.current?.show(
      "Remove Milestone?", 
      "Yes, Remove", "Cancel", 
      `Are you sure you want to remove milestone ${ms.identifier}?`);
  };

  const onConfirmRemove = () => {
    if (milestone === undefined) return;
    submit({ intent: "remove-milestone", 
      milestone: { id: milestone.id, identifier: milestone.identifier }},
      { method: "post", encType: "application/json" });
  };

  const handleMove = (milestone: Milestone, direction: number) => {
    if ((direction > 0 && milestone.index === maxIndex) || (direction < 0 && milestone.index === 0)) return;
    submit({ intent: "change-index", 
      milestone: { id: milestone.id, identifier: milestone.identifier, direction }},
      { method: "post", encType: "application/json" });
  };

  const Identifier = ({ milestone }: { milestone: Milestone }) => (
    <>
      <span className="text-sm text-gray-300 pt-1 pr-3">
        {(milestone.index || 0)+1}
      </span> 
      <span className={classnames(milestone.target === true ? "text-indigo-500 font-medium": "", "text-gray-500")}>{milestone.identifier}</span>
    </>
  );

  const days = (days: number | null) => `${days || 0} ${pluralize('Day', days || 0)}`

  const columns = [
    { 
      name: "identifier", display: (ms: Milestone) => <Identifier milestone={ms} />
    }, 
    { name: "description", className: "text-md w-full max-w-0 sm:w-auto sm:max-w-none", stack: "sm" },
    { name: "entities", display: (ms: Milestone) => ms.entities?.map(e => t(e)).join(', '), stack: "sm" },
    { name: "interval", type: "number", className: "w-16", display: (ms: Milestone) => days(ms.interval) },
  ];

  const actions = [
    { 
      name: "up", 
      className: (ms: Milestone) => (ms.index || 0) === maxIndex ? "text-gray-300 cursor-default" : "text-gray-600 hover:text-gray-800",
      onClick: (ms: Milestone) => handleMove(ms, 1)
    }, 
    
    { 
      name: "down", 
      className: (ms: Milestone) => (ms.index || 0) === 0 ? "text-gray-300 cursor-default" : "text-gray-600 hover:text-gray-800",
      onClick: (ms: Milestone) => handleMove(ms, -1)
    },
    { 
      name: "remove", 
      className: () => "font-medium text-red-600 hover:text-red-500",
      onClick: (ms: Milestone) => handleRemove(ms) 
    }
  ];

  return (
    <>
      {milestones.length <= 0 && <Alert title={`No milestones`} level={Level.Warning} />}

      <Table data={milestones} columns={columns} actions={actions} showHeadings={false} />

      <ConfirmModal ref={confirm} onYes={onConfirmRemove} />
    </>
  );
}
