import { json, type LoaderArgs, type ActionArgs, redirect } from '@remix-run/node';
import { useLoaderData, Outlet, useSearchParams, useSubmit } from '@remix-run/react';

import { WalletIcon, PlusIcon } from '@heroicons/react/24/outline';

import { badRequest, notFound } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';

import ScheduleService from '~/services/scheduler/schedules.server';
import LegalEntityService from '~/services/manage/legal-entities.server';
import Header from '~/components/header';
import { Breadcrumb, BreadcrumbProps } from '~/layout/breadcrumbs';
import { GenerateSingleModal, validator } from '~/components/scheduler/generate';

import { scheduler } from '~/auth/permissions';
import { useRef } from 'react';
import { RefModal } from '~/components/modals/modal';
import toNumber from '~/helpers/to-number';

export const handle = {
  name: ({ legalEntity }: { legalEntity: any }) => legalEntity?.name,
  breadcrumb: ({ legalEntity, current, name }: { legalEntity: any } & BreadcrumbProps) => 
    <Breadcrumb to={`/schedules/${legalEntity?.id}`} name={name} current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest('Invalid request');

  const url = new URL(request.url);
  const year = toNumber(url.searchParams.get("year") as string) || new Date().getFullYear();

  const u = await requireUser(request);

  const service = LegalEntityService(u);
  const legalEntity = await service.getLegalEntity({ id });

  if (legalEntity === undefined) return notFound('Legal entity not found');

  return json({ legalEntity, year });
};

export const action = async ({ request, params }: ActionArgs) => {
  const url = new URL(request.url);
  const year = toNumber(url.searchParams.get("year") as string) || new Date().getFullYear();

  const u = await requireUser(request);
  const formData = await request.formData();
  const result = await validator.validate(formData);
  
  if (result.error) return;

  const service = ScheduleService(u);
  await service.generate(result.data);

  return redirect(`schedules?year=${year}`);
};

export default function Provider() {
  const submit = useSubmit();
  const [ searchParams ] = useSearchParams();
  const { legalEntity: { logo, ...legalEntity }, year } = useLoaderData();

  const modal = useRef<RefModal>(null);

  const handleGenerate = (data: FormData) => {
    submit(data, { method: "POST", action: `/schedules/${legalEntity.id}?year=${year}` });
  };

  const tabs = [
    { name: 'info', to: 'info' },
    { name: 'summary', to: 'summary' },
    { name: 'schedules', to: 'schedules' },
    { name: 'approvals', to: 'approvals' },
    { name: 'approvers', to: 'approvers' },
    { name: 'holidays', to: 'holidays' },
  ];

  const actions = [
    { title: 'generate-schedules', onClick: () => modal.current?.show(),
      default: true, icon: PlusIcon, permission: scheduler.create.schedule },
  ];

  const icon = (logo?.length && logo) || <WalletIcon className="h-12 w-12 text-gray-300" aria-hidden="true" />;

  return (
    <>
      <Header title={legalEntity.name} tabs={tabs} actions={actions} group={true} icon={icon} />
      <Outlet />
      <GenerateSingleModal modal={modal} onGenerate={handleGenerate}
        legalEntity={legalEntity} year={year} />
    </>
  );
};