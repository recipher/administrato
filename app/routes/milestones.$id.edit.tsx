import { useState, useRef } from 'react';
import { ActionArgs, json, redirect, type LoaderArgs } from '@remix-run/node';
import { useLoaderData, useSubmit } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

import { badRequest } from '~/utility/errors';

import MilestoneService, { type MilestoneSet, type Milestone } from '~/models/scheduler/milestones.server';
import Alert, { Level } from '~/components/alert';

import ConfirmModal, { type RefConfirmModal } from "~/components/modals/confirm";
import { Breadcrumb } from "~/layout/breadcrumbs";
import { setFlashMessage, storage } from '~/utility/flash.server';

import classnames from '~/helpers/classnames';

export const handle = {
  breadcrumb: ({ milestoneSet, current }: { milestoneSet: any, current: boolean }) => 
    <Breadcrumb to={`/milestones/${milestoneSet.id}/edit`} name="edit" current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest('Invalid data');

  const service = MilestoneService();
  const milestoneSet = await service.getMilestoneSetById({ id });
  const milestones = await service.getMilestonesBySet({ setId: Number(id) });

  return json({ milestoneSet, milestones });
};

export const action = async ({ request, params }: ActionArgs) => {
  const service = MilestoneService();

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
      (milestone.direction > 0)
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

  return (
    <>
      {milestones.length <= 0 && <Alert title={`No milestones`} level={Level.Warning} />}

      <ul className="divide-y divide-gray-100 py-3">
        {milestones.map((ms: any, index: number) => (
          <li key={`${ms.id}-${index}`} className="group">
            <div className="flex justify-between gap-x-6 py-3">
              <div className="flex min-w-0 gap-x-4">
                <span className="text-sm text-gray-300 pt-1">
                  {ms.index+1}
                </span> 
                <span className="text-medium">{ms.identifier}</span>
                {ms.description}
              </div>
              <div className="flex shrink-0 items-center gap-x-6">
                <ul className="group-hover:block hidden">
                  <li className="inline pl-3">
                    <button type="button" onClick={() => handleMove(ms, 1)}
                      className={classnames((ms.index || 0) === maxIndex ? "text-gray-200 cursor-default" : "text-gray-400 hover:text-gray-500")}>
                      {t('up')}
                    </button>
                  </li>
                  <li className="inline pl-3">
                    <button type="button" onClick={() => handleMove(ms, -1)}
                      className={classnames((ms.index || 0) === 0 ? "text-gray-200 cursor-default" : "text-gray-400 hover:text-gray-500")}>
                      {t('down')}
                    </button>
                  </li>
                  <li className="inline pl-3">
                    <button onClick={() => handleRemove(ms)}
                      type="button" className="font-medium text-red-600 hover:text-red-500">
                      {t('remove')}
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <ConfirmModal ref={confirm} onYes={onConfirmRemove} />
    </>
  );
}
