import { json, type ActionArgs, type LoaderArgs } from '@remix-run/node';
import { Link, useLoaderData, useSubmit } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

import { ArrowPathIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

import { useUser } from '~/hooks';
import { requireUser } from '~/auth/auth.server';

import CountryService, { type Country } from '~/services/countries.server';

import Header from '~/components/header/advanced';
import Alert, { Level } from '~/components/alert';
import Pagination from '~/components/pagination';
import { List } from '~/components/list';
import { ButtonType } from '~/components/button';
import { Flag } from '~/components/countries/flag';

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

  const { countries, metadata: { count }} = await service.searchCountries({ search }, { offset, limit, sortDirection: sort });

  return json({ countries, count, offset, limit, search });
};

export const action = async ({ request }: ActionArgs) => {
  const u = await requireUser(request);
  const service = CountryService(u);
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
  const submit = useSubmit();
  const user = useUser();
  const { countries, count, offset, limit, search } = useLoaderData();

  const actions = [
    { title: "sync", icon: ArrowPathIcon, type: ButtonType.Secondary, 
      onClick: () => submit({ intent: "sync" }, { method: "post" }), 
      permission: scheduler.create.holiday },
  ];

  return (
    <>
      <Header title='holidays' actions={actions} filterTitle='Search countries' filterParam='q' allowSort={true} />

      {count <= 0 && <Alert title={`No countries found ${search === null ? '' : `for ${search}`}`} level={Level.Warning} />}

      <List data={countries} idKey="isoCode" renderItem={Country} renderContext={Context} />
      <Pagination entity='country' totalItems={count} offset={offset} limit={limit} />
    </>
  );
}
