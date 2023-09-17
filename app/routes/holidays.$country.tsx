import { useRef } from 'react';
import { type LoaderArgs } from '@remix-run/node';
import { Outlet, useLoaderData, useSubmit } from '@remix-run/react';
import { PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

import { badRequest, notFound } from '~/utility/errors';

import CountryService, { type Country } from '~/models/countries.server';
import ConfirmModal, { type RefConfirmModal } from "~/components/modals/confirm";
import Header from '~/components/header/basic-with-actions';
import { ButtonType } from '~/components/button';
import toNumber from '~/helpers/to-number';

import { Breadcrumb } from "~/layout/breadcrumbs";
import { Flag } from "~/components/countries/countries";

export const handle = {
  breadcrumb: ({ country, parent, current }: { country: Country, parent: Country, current: boolean }) => {
    const crumb = <Breadcrumb key={country.isoCode} to={`/holidays/${country?.isoCode}`} name={country?.name } current={current} />;
    
    return !parent ? crumb : [ 
      <Breadcrumb key={parent.isoCode} to={`/holidays/${parent?.isoCode}`} name={parent?.name} />,
      <Breadcrumb key={`${parent.isoCode}-r`} to={`/holidays/${parent?.isoCode}/regions`} name="regions" />,
      crumb ];
  }
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const url = new URL(request.url);
  const year = toNumber(url.searchParams.get("year") as string) || new Date().getFullYear();

  const { country: isoCode } = params;

  if (isoCode === undefined) return badRequest();

  const service = CountryService();
  const country = await service.getCountry({ isoCode });
  const parent = country.parent ? await service.getCountry({ isoCode: country.parent }) : null;

  if (country === undefined) return notFound(`Country ${isoCode} not found`);

  return { country, year, parent };
};

export default function Holidays() {
  const submit = useSubmit();
  const confirm = useRef<RefConfirmModal>(null);
  const { country, year } = useLoaderData();

  const sync = () =>
    confirm.current?.show("Synchronize Holidays?", "Yes, Synchronize", "Cancel", `Are you sure you want to synchronize holidays for ${country.name}, ${year}?`);
  
  const onConfirmSync = () => submit({ intent: "sync", country, year }, { action: `/holidays/${country.isoCode}/holidays?year=${year}`, method: "post", encType: "application/json" });

  const icon = <Flag size={12} country={country.name} isoCode={country.isoCode} />;

  const tabs = [
    { name: 'holidays', to: 'holidays' },
    { name: 'regions', to: 'regions', hidden: !!country.parent },
    { name: 'overrides', to: 'overrides' },
  ];
  
  const actions = [
    { title: "sync", icon: ArrowPathIcon, type: ButtonType.Secondary, onClick: sync },
    { title: "add-holiday", to: "add", icon: PlusIcon },
  ];

  return (
    <>
      <Header title={country.name} subtitle={country.isoCode} actions={actions} tabs={tabs} icon={icon} />
      <Outlet />
      <ConfirmModal ref={confirm} onYes={onConfirmSync} />
    </>
  );
};
