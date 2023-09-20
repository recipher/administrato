import { intlFormat } from 'date-fns';
import { useRef, useState } from 'react';
import { redirect, type LoaderArgs, type ActionArgs } from '@remix-run/node';
import { useLoaderData, useNavigate, useSearchParams, useSubmit } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

import { badRequest, notFound } from '~/utility/errors';
import ProviderService from '~/models/manage/providers.server';
import HolidayService, { type Holiday } from '~/models/scheduler/holidays.server';
import { setFlashMessage, storage } from '~/utility/flash.server';
import Alert, { Level } from '~/components/alert';
import ConfirmModal, { RefConfirmModal } from "~/components/modals/confirm";
import Tabs from '~/components/tabs';
import toNumber from '~/helpers/to-number';
import { List, ListItem, ListContext } from '~/components/list';

import { Breadcrumb } from "~/layout/breadcrumbs";
import { useLocale } from 'remix-i18next';

export const handle = {
  breadcrumb: ({ provider, current }: { provider: any, current: boolean }) => 
    <Breadcrumb to={`/manage/providers/${provider?.id}/holidays`} name="holidays" current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest('Invalid request');

  const u = await requireUser(request);

  const service = ProviderService(u);
  const provider = await service.getProvider({ id });

  if (provider === undefined) return notFound('Provider not found');

  return json({ provider });
};

const Holidays = () => {
  const { provider } = useLoaderData();

  const Item = (holiday: Holiday) =>
    <ListItem data={holiday.name} sub={intlFormat(new Date(holiday.date), { year: 'numeric', month: 'long', day: 'numeric' }, { locale })} />

  const Context = (holiday: Holiday) => 
    <ListContext data={
      <div className="hidden group-hover:block">
        <button
          type="button"
          onClick={() => remove(holiday)}
          className="inline-flex items-center gap-x-1.5 font-medium text-sm text-red-600 hover:text-red-500"
        >
          {t('remove')}
        </button>
      </div>
    } chevron={false} />

  const noOp = () => null;

  return (
    <>
      {holidays.length === 0 && <Alert level={Level.Info} title={`No holidays for ${country.name}`} />}

      {/* <Tabs tabs={tabs} selected={year} onClick={handleClick} /> */}
      <List data={holidays} onClick={noOp} renderItem={Item} renderContext={Context} />
      {/* <ConfirmModal ref={confirm} onYes={onConfirmRemove} /> */}
    </>
  );};

export default Holidays;
