import { json, type ActionArgs, type LoaderArgs } from '@remix-run/node';
import { Form, Link, useLoaderData } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

import { ArrowPathIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

import CountryService, { type Country } from '~/models/countries.server';
import { useUser } from '~/hooks';
import Header from '~/components/header/with-filter';
import Alert, { Level } from '~/components/alert';
import Pagination from '~/components/pagination';
import { List } from '~/components/list';
import Button, { ButtonType } from '~/components/button';
import { Flag } from '~/components/countries/countries';

import pluralize from '~/helpers/pluralize';
import toNumber from '~/helpers/to-number';

import { scheduler } from '~/auth/permissions';

const LIMIT = 6;

export const loader = async ({ request }: LoaderArgs) => {
  const url = new URL(request.url);
  const offset = toNumber(url.searchParams.get("offset") as string);
  const limit = toNumber(url.searchParams.get("limit") as string) || LIMIT;
  const search = url.searchParams.get("q");
  const sort = url.searchParams.get("sort");

  const service = CountryService();

  const countries = await service.searchCountries({ search }, { offset, limit, sortDirection: sort });
  const count = await service.countCountries({ search });

  return json({ countries, count, offset, limit, search });
};

export const action = async ({ request }: ActionArgs) => {
  const service = CountryService();
  const countries = await service.syncCountries();

  return { countries };
};

const Country = ((country: Country) => (
  <>
    <Flag size={12} country={country.name} isoCode={country.isoCode} />
    <div className="min-w-0 flex-auto">
      <p className="text-md font-semibold leading-6 text-gray-900">
        {country.name}
      </p>
      <p className="mt-1 flex text-xs leading-5 text-gray-500">
        {country.isoCode}
      </p>
    </div>
  </>
));

const Context = (country: Country) => (
  <>
    <Link to={`${country.isoCode}/regions`} className="hidden sm:flex sm:flex-col sm:items-end">
      {country.regionCount} {pluralize('region', country.regionCount)}
    </Link>
    <ChevronRightIcon className="h-5 w-5 flex-none text-gray-400" aria-hidden="true" />
  </>
);

export default function Countries() {
  const { t } = useTranslation();
  const user = useUser();
  const { countries, count, offset, limit, search } = useLoaderData();

  const hasPermission = (p: string) => user.permissions.includes(p);

  return (
    <>
      <Header title='holidays' filterTitle='Search countries' filterParam='q' allowSort={true} />

      {count <= 0 && <Alert title={`No countries found ${search === null ? '' : `for ${search}`}`} level={Level.Warning} />}

      <List data={countries} idKey="isoCode" renderItem={Country} renderContext={Context} />
      <Pagination entity='country' totalItems={count} offset={offset} limit={limit} />

      {hasPermission(scheduler.create.holiday) &&<div className="pt-6 flex border-t border-gray-900/10  items-center justify-start gap-x-6">
        <Form method="post">
          <Button icon={ArrowPathIcon} title={t('sync')} type={ButtonType.Secondary} submit={true} />
        </Form>
      </div>}
    </>
  );
}