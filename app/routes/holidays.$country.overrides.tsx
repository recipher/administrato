import { intlFormat } from 'date-fns';
import { type LoaderArgs } from '@remix-run/node';
import { Link, useLoaderData, useNavigate, useSearchParams } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

import { badRequest, notFound } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';

import CountryService from '~/services/countries.server';
import HolidayService, { type Holiday } from '~/services/scheduler/holidays.server';
import Alert, { Level } from '~/components/alert';
import { List, ListItem, ListContext } from "~/components/list";
import Tabs from '~/components/tabs';
import toNumber from '~/helpers/to-number';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import { useLocale } from 'remix-i18next';
import pluralize from '~/helpers/pluralize';

export const handle = {
  name: "overrides",
  breadcrumb: ({ country, year, ...props }: { country: any, year: number } & BreadcrumbProps) => 
    <Breadcrumb to={`/holidays/${country?.isoCode}/overrides?year=${year}`} {...props} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const u = await requireUser(request);

  const url = new URL(request.url);
  const year = toNumber(url.searchParams.get("year") as string) || new Date().getFullYear();
  const { country: isoCode } = params;

  if (isoCode === undefined) return badRequest('Invalid request');

  const countryService = CountryService();
  const country = await countryService.getCountry({ isoCode });

  if (country === undefined) return notFound('Country not found');

  const holidayService = HolidayService(u);
  let holidays = await holidayService.listCustomHolidaysByCountry({ locality: isoCode, year });

  return { holidays, country, year };
};

const noOp = () => null!
const years = (year: number) => [...Array(5).keys()].map(index => year + index - 1);

export default function Holidays() {
  const locale = useLocale();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const { holidays, country, year } = useLoaderData();

  const tabs = years(new Date().getUTCFullYear())
    .map((year: number) => ({ name: year.toString() }));

  const [ searchParams ] = useSearchParams();
  const qs = searchParams.toString() || '';
  const params = new URLSearchParams(qs);

  const handleClick = (year: string ) => {
    params.set("year", year);
    navigate(`?${params.toString()}`);
  };

  const Item = (holiday: Holiday) =>
    <ListItem data={holiday.name} sub={intlFormat(new Date(holiday.date), { year: 'numeric', month: 'long', day: 'numeric' }, { locale })} />

  const entity = (holiday: any) => {
    if (holiday.client) return "client";
    if (holiday.legalEntity) return "legal-entity";
    if (holiday.securityGroup) return "security-group";
    if (holiday.provider) return "provider";
    return "";
  };

  const name = (holiday: any) => 
    holiday.client || holiday.provider || holiday.securityGroup || holiday.legalEntity

  const Context = (holiday: any) =>
    <ListContext select={false} sub={t(entity(holiday))} data={
      <Link to={`/manage/${pluralize(entity(holiday))}/${holiday.entityId}/info`}>{name(holiday)}</Link>} />

  return (
    <>
      <Tabs tabs={tabs} selected={year} onClick={handleClick} />

      {holidays.length === 0 && <Alert level={Level.Info} title={`No overridden holidays for ${country.name}`} />}

      <List data={holidays} onClick={noOp} renderItem={Item} renderContext={Context} />
    </>
  );
}
