import { json, type LoaderArgs } from '@remix-run/node';
import { useLoaderData, useNavigate, useSearchParams, useSubmit } from '@remix-run/react';

import { notFound, badRequest } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';

import LegalEntityService from '~/models/manage/legal-entities.server';

import { Breadcrumb } from "~/layout/breadcrumbs";
import Alert, { Level } from '~/components/alert';
import Tabs from '~/components/tabs';

import toNumber from '~/helpers/to-number';

export const handle = {
  breadcrumb: ({ legalEntity, current }: { legalEntity: any, current: boolean }) => 
    <Breadcrumb to={`/schedules/${legalEntity?.id}/schedules`} name="schedules" current={current} />
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

const Schedules = () => {
  const { legalEntity, year, schedules = [] } = useLoaderData();

  const navigate = useNavigate();
  const [ searchParams ] = useSearchParams();

  const years = (year: number) => [...Array(5).keys()].map(index => year + index - 1);

  const tabs = years(new Date().getUTCFullYear())
    .map((year: number) => ({ name: year.toString() }));

  const handleClick = (year: string ) => {
    searchParams.set("year", year);
    navigate(`?${searchParams.toString()}`);
  };

  return (
    <>
      <Tabs tabs={tabs} selected={year.toString()} onClick={handleClick} />

      {schedules.length === 0 && <Alert level={Level.Info} title={`No schedules for ${year}`} />}
    </>
  );
};

export default Schedules;
