import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { json, redirect, type LoaderArgs, ActionArgs } from '@remix-run/node';
import { useLoaderData, useSubmit } from '@remix-run/react';

import { PlusIcon } from '@heroicons/react/24/outline';

import { notFound, badRequest } from '~/utility/errors';

import { type User } from '~/auth/auth.server';
import { useUser } from '~/hooks';

import { LegalEntity } from '~/services/manage/legal-entities.server';
import { type Approver } from '~/services/scheduler/approvals.server';
import { Alert, Level, Button, ButtonType } from '~/components';

import ConfirmModal, { type RefConfirmModal } from "~/components/modals/confirm";
import { RefModal } from '~/components/modals/modal';
import { SelectorModal } from '~/components/access/users';

import { scheduler } from '~/auth/permissions';
import classnames from '~/helpers/classnames';

type Props = { 
  approvers: Array<Approver>;
  legalEntity: LegalEntity;
  user: User;
  setId?: string | null;
  className?: string 
};

export const Approvers = ({ approvers, legalEntity, user, setId = null, className = "" }: Props) => {
  const { t } = useTranslation();

  const modal = useRef<RefModal>(null);
  const submit = useSubmit();
  const [ approver, setApprover ] = useState<Approver>();

  const confirm = useRef<RefConfirmModal>(null);

  const hasPermission = (p: string) => user.permissions.includes(p);

  const handleRemove = (approver: Approver) => {
    setApprover(approver);
    confirm.current?.show(
      "Remove Approver?", 
      "Yes, Remove", "Cancel", 
      `Are you sure you want to remove this approver?`);
  };

  const onConfirmRemove = () => {
    if (approver === undefined) return;
    submit({ intent: "remove-approver", 
             approver: { id: approver.id },
             // @ts-ignore
             user: { id: approver.userId, name: approver.userData?.name },
             legalEntity: { id: legalEntity.id, name: legalEntity.name },
             setId
           },
      { method: "POST", encType: "application/json" });
  };

  const handleAdd = (user: User) => {
    submit({ intent: "add-approver", 
             user: { id: user.id, name: user.name, email: user.email },
             legalEntity: { id: legalEntity.id, name: legalEntity.name },
             setId
           },
      { method: "POST", encType: "application/json" });
  };

  const showModal = () => modal.current?.show();

  return (
    <>
      {approvers.length <= 0 && <Alert title='No default approvers' level={Level.Warning} />}

      <ul role="list" className={classnames(className, "text-md leading-6")}>
        {approvers.map((approver: Approver) => (
          <li key={approver.id} className="group flex justify-between gap-x-6 py-4 cursor-pointer">
            <div>
              {/* @ts-ignore */}
              <span className="font-medium text-md text-gray-900 pr-3">{approver.userData?.name}</span>
              {/* @ts-ignore */}
              <span className="font-medium text-sm text-gray-500 pr-3">{approver.userData?.email}</span>
            </div>
            {hasPermission(scheduler.create.schedule) && <div className="hidden group-hover:block">
              <button onClick={() => handleRemove(approver)}
                type="button" className="hidden group-hover:block font-medium text-red-600 hover:text-red-500">
                {t('remove')}
              </button>
            </div>}
          </li>
        ))}
      </ul>

      {hasPermission(scheduler.create.schedule) && <div className="flex pt-3">
        <Button icon={PlusIcon} title={t('Add an Approver')} 
          type={ButtonType.Secondary} onClick={showModal} />
      </div>}
      <SelectorModal modal={modal} onSelect={handleAdd} />
      <ConfirmModal ref={confirm} onYes={onConfirmRemove} />
    </>
  )
}