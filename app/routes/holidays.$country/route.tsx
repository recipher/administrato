import { useRef } from 'react';
import { type LoaderArgs, json } from '@remix-run/node';
import { Outlet, useLoaderData, useSubmit } from '@remix-run/react';
import { PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

import { getCountry } from '~/models/countries.server';
import ConfirmModal, { RefConfirmModal } from "~/components/modals/confirm";
import Header from '~/components/header/with-actions';
import Image from '~/components/image';
import { ButtonType } from '~/components/button';
import toNumber from '~/helpers/to-number';

const badRequest = (message: string) => json({ message }, { status: 400 });

export const loader = async ({ request, params }: LoaderArgs) => {
  const url = new URL(request.url);
  const year = toNumber(url.searchParams.get("year") as string) || new Date().getFullYear();

  const { country: isoCode } = params;

  if (isoCode === undefined) return badRequest('Invalid request');

  const country = await getCountry(isoCode);

  return { country, year };
};

export default function Holidays() {
  const submit = useSubmit();
  const confirm = useRef<RefConfirmModal>(null);
  const { country, year } = useLoaderData();

  const sync = () =>
    confirm.current?.show("Synchronize Holidays?", "Yes, Synchronize", "Cancel", `Are you sure you want to synchronize holidays for ${country.name}, ${year}?`);
  
  const onConfirmSync = () => submit({ intent: "sync", country, year }, { action: `/holidays/${country.isoCode}/holidays?year=${year}`, method: "post", encType: "application/json" });

  const icon = <Image className="h-6 w-6 flex-none bg-white mr-4"
    src={`https://cdn.ipregistry.co/flags/twemoji/${country.isoCode.toLowerCase()}.svg`} />;

  const tabs = [
    { name: 'Holidays', to: 'holidays' },
    { name: 'Regions', to: 'regions', hidden: !!country.parent },
    { name: 'Overrides', to: 'overrides' },
  ];
  
  const actions = [
    { title: "Sync", icon: ArrowPathIcon, type: ButtonType.Secondary, onClick: sync },
    { title: "Add a Holiday", to: "add", icon: PlusIcon },
  ];

  return (
    <>
      <Header title={country.name} subtitle={country.isoCode} actions={actions} tabs={tabs} icon={icon} />
      <Outlet />
      <ConfirmModal ref={confirm} onYes={onConfirmSync} />
    </>
  );
};
