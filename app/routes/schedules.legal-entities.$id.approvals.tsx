import { useTranslation } from 'react-i18next';
import { json, type LoaderArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import { notFound, badRequest } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';

import LegalEntityService from '~/services/manage/legal-entities.server';
import ApprovalsService, { Status } from '~/services/scheduler/approvals.server';
import ScheduleService, { ScheduleWithDates } from '~/services/scheduler/schedules.server';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import { Layout, Heading } from '~/components/info/info';
import { Alert, Level } from '~/components';

import toNumber from '~/helpers/to-number';

export const handle = {
  i18n: "schedule",
  name: "approvals",
  breadcrumb: ({ legalEntity, current, name }: { legalEntity: any } & BreadcrumbProps) => 
    <Breadcrumb to={`/schedules/legal-entities/${legalEntity?.id}/approvals`} name={name} current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest('Invalid request');

  const url = new URL(request.url);
  const year = toNumber(url.searchParams.get("year") as string) || new Date().getFullYear();
  const status = url.searchParams.get("status") || Status.Draft;

  const u = await requireUser(request);

  const service = LegalEntityService(u);
  const legalEntity = await service.getLegalEntity({ id });

  if (legalEntity === undefined) return notFound('Legal entity not found');
  
  const approvalsService = ApprovalsService(u);
  const approvals = await approvalsService.listApprovalsByEntityId({ entityId: id, status: status as Status });

  const scheduleService = ScheduleService(u);
  const schedules = await scheduleService.listSchedulesByLegalEntity({ legalEntityId: id, year, status: status as Status });

  return json({ legalEntity, approvals, schedules });
};

const Holidays = () => {
  const { t } = useTranslation();
  const { legalEntity, approvals, schedules } = useLoaderData();

  return (
    <>
      <Layout>
        <Heading heading={t('approvals')} explanation={`Manage ${legalEntity.name}'s schedule approvals.`} />
      
        {schedules.length <= 0 && <Alert title='No approvals' level={Level.Info} />}

        <>
          <ul role="list" className="">
            {schedules.map((schedule: ScheduleWithDates) => (
              <li key={schedule.id} className="group flex justify-between gap-x-6 py-4 cursor-pointer">
                <div>
                  {/* @ts-ignore */}
                  <span className="font-medium text-md text-gray-900 pr-3">{schedule.name}</span>
                  {/* @ts-ignore */}
                  <span className="font-medium text-sm text-gray-500 pr-3">{schedule.date}</span>
                </div>
                {/* {hasPermission(scheduler.create.schedule) && <div className="hidden group-hover:block">
                  <button onClick={() => handleRemove(approver)}
                    type="button" className="hidden group-hover:block font-medium text-red-600 hover:text-red-500">
                    {t('remove')}
                  </button>
                </div>} */}
              </li>
            ))}
          </ul>

          {/* {hasPermission(scheduler.create.schedule) && <div className="flex pt-3">
            <Button icon={PlusIcon} title={t('Add an Approver')} 
              type={ButtonType.Secondary} onClick={showModal} />
          </div>}
          <SelectorModal modal={modal} onSelect={handleAdd} />
          <ConfirmModal ref={confirm} onYes={onConfirmRemove} /> */}
        </>
      </Layout>
    </>
  );
};

export default Holidays;
