import { useTranslation } from 'react-i18next';
import { json, type LoaderArgs } from '@remix-run/node';
import { useLoaderData, useNavigate, useSearchParams } from '@remix-run/react';
import { intlFormat } from 'date-fns';
import { useLocale } from 'remix-i18next';

import { notFound, badRequest } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';

import LegalEntityService, { type LegalEntity } from '~/services/manage/legal-entities.server';
import { type SecurityGroup } from '~/services/manage/security-groups.server';
import { type Client } from '~/services/manage/clients.server';
import { type Provider } from '~/services/manage/providers.server';
import ScheduleService, { Status } from '~/services/scheduler/schedules.server';
import { type Holiday } from '~/services/scheduler/holidays.server';
import CountryService, { type Country } from '~/services/countries.server';

import Alert, { Level } from '~/components/alert';
import { List, ListContext } from '~/components/list';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import { Tabs } from '~/components';
import { Flag } from '~/components/countries/flag';

import toNumber from '~/helpers/to-number';

type HasLocality = SecurityGroup | Provider | Client | LegalEntity;

export const handle = {
  i18n: "schedule",
  name: "holidays",
  breadcrumb: (props: BreadcrumbProps) => <Breadcrumb {...props} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest('Invalid request');

  const url = new URL(request.url);
  const year = toNumber(url.searchParams.get("year") as string) || new Date().getFullYear();
  const status = url.searchParams.get("status") || Status.Approved;

  const u = await requireUser(request);

  const service = LegalEntityService(u);
  const { legalEntity, ...entities } = await service.getRelatedEntities({ id });

  if (legalEntity === undefined) return notFound('Legal entity not found');

  const scheduleService = ScheduleService(u);
  const holidays = await scheduleService.listHolidaysForSchedules({ legalEntityId: legalEntity.id, year, status: status as Status });

  const isoCodes = holidays.map((h: Holiday) => h.locality);
  const countryService = CountryService();
  const countries = await countryService.getCountries({ isoCodes });

  const statuses = Object.values(Status).filter(item => isNaN(Number(item)));

  return json({ legalEntity, ...entities, holidays, year, statuses, status, countries });
};

const noOp = () => null!

const Holidays = () => {
  const { t } = useTranslation();
  const { t: ts } = useTranslation("schedule");
  const locale = useLocale();
  const { legalEntity, client, provider, securityGroup, 
    holidays, countries, year, status, statuses } = useLoaderData();

  const navigate = useNavigate();
  const [ searchParams ] = useSearchParams();

  const yearData = ((year: number) => [...Array(5).keys()].map(index => year + index - 1))(new Date().getUTCFullYear())
    .map((year: number) => ({ name: year.toString() }));
  const statusData = statuses.map((status: Status) => ({ name: ts(status), value: status }));
  const handleYearClick = (year: string) => handleClick("year", year);
  const handleStatusClick = (status: string) => handleClick("status", status);
  const handleClick = (param: string, value: string ) => {
    searchParams.set(param, value);
    navigate(`?${searchParams.toString()}`);
  };

  const Item = (holiday: Holiday) =>
    <>
      <div className="min-w-0 flex-auto">
        <p className="text-gray-900 font-medium text-md leading-6">
          {holiday.name}
        </p>
        <p className="text-gray-700 mt-1 flex text-sm leading-5">
          {intlFormat(new Date(holiday.date), { year: 'numeric', month: 'long', day: 'numeric' }, { locale })}
        </p>
      </div>
    </>;

  const localities = holidays.reduce((localities: Array<string>, holiday: Holiday) => 
    localities.includes(holiday.locality) ? localities : [ ...localities, holiday.locality ], []);

  const entities = (locality: string) => {
    const data = new Map<string, HasLocality>([ 
      [ "provider", provider ],
      [ "client", client ],
      [ "security-group", securityGroup ],
      [ "legal-entity", legalEntity ]
    ]);

    return Array.from(data.keys()).map((entity: string) => 
      data.get(entity)?.localities?.includes(locality) ? entity : undefined)
      .reduce((entities: string[], e) => e === undefined ? entities: [ ...entities, e ], []);
  };

  return (
    <>
      <Tabs tabs={yearData} selected={year.toString()} onClick={handleYearClick} />
      <Tabs tabs={statusData} selected={status} onClick={handleStatusClick} />
    
      {holidays.length === 0 && <Alert level={Level.Warning} title={`No schedules`} />}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {localities.map((locality: string) => {
          const country = countries.find((country: Country) => country.isoCode === locality);
          return (
            <div key={locality}>
              <h3 className="mt-6 font-medium text-lg flex items-center">
                <Flag size={6} isoCode={country.parentId ? country.parentId : country.isoCode} />
                <div className="ml-3">{country.name}</div>
              </h3>
              <ul className="flex text-md text-gray-500">
                {entities(locality).map(e => <li key={e} className="mr-3">{t(e)}</li>)}
              </ul>
              <List data={holidays.filter((h: Holiday) => h.locality === locality)} 
                onClick={noOp} renderItem={Item} renderContext={() => <ListContext select={false} />} />
            </div>
          )})}
      </div>
    </>
  );
};

export default Holidays;
