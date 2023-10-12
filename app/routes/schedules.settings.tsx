import { useEffect, useRef, useState } from "react";
import { type LoaderArgs, type ActionArgs, json } from "@remix-run/node";
import { useFetcher, useLoaderData, useSubmit } from "@remix-run/react";
import { format, setDay } from 'date-fns';
import { useTranslation } from "react-i18next";

import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";
import { PlusIcon } from "@heroicons/react/24/outline";

import { requireUser } from "~/auth/auth.server";
import { useUser } from "~/hooks";

import WorkingDayService, { create, type WorkingDays, type Country } from '~/services/scheduler/working-days.server';

import { Table, Button, ButtonType, Spinner } from '~/components';
import { Layout, Heading } from '~/components/info/info';
import { CountriesModal } from '~/components/countries/countries';
import { Flag } from '~/components/countries/flag';
import { RefModal } from '~/components/modals/modal';

import { Breadcrumb, BreadcrumbProps } from '~/layout/breadcrumbs';

import { scheduler } from '~/auth/permissions';
import classnames from "~/helpers/classnames";

export const handle = {
  name: "settings",
  breadcrumb: ({ current, name }: BreadcrumbProps) => 
    <Breadcrumb to='/schedules/settings' name={name} current={current} />
};

const Days = [ ...Array(7).keys() ];

export const loader = async ({ request }: LoaderArgs) => {
  const u = await requireUser(request);
  
  const service = WorkingDayService(u);
  const workingDays = await service.listWorkingDays();

  return json({ workingDays });
};

export const action = async ({ request }: ActionArgs) => {
  const u = await requireUser(request);
  const { intent, ...data } = await request.json();

  const service = WorkingDayService(u);
  
  if (intent === "save-country") {
    await service.saveWorkingDays(create({ country: data.country }));
  }
  
  if (intent === "remove-country") {
    await service.removeWorkingDays({ country: data.country });
  }
  
  if (intent === "change-setting") {
    const { workingDays, day } = data;
    const days = Days.reduce((acc: number[], d: number) =>
      workingDays.days.includes(d) 
        ? d === day ? acc : [ ...acc, d ]
        : d !== day ? acc : [ ...acc, d ]
    , []);
    await service.saveWorkingDays({ ...workingDays, days });
  }

  return null;
};

export default () => {
  const today = new Date();
  const { t } = useTranslation();
  const fetcher = useFetcher();
  const u = useUser();

  const modal = useRef<RefModal>(null);
  const [ country, setCountry ] = useState<string>();
  const [ changing, setChanging ] = useState<{ country: string; day: number }>();

  const submit = useSubmit();
  const { workingDays } = useLoaderData();
     
  const showCountriesModal = () => modal.current?.show();
  const handleSelectCountry = (country: Country) =>
    submit({ intent: "save-country", country: country.isoCode }, { method: "POST", encType: "application/json" });

  const handleSelect = ({ country: code }: WorkingDays) =>
    setCountry(country === code ? undefined : code);

  const handleRemove = ({ country: code }: WorkingDays) =>
    submit({ intent: "remove-country", country: code }, { method: "POST", encType: "application/json" });

  useEffect(() => {
    if (fetcher.state === "idle") setChanging(undefined);
  }, [fetcher.state])

  const On = ({ colour = "green-500", opacity = 100 }: any) => <CheckCircleIcon className={`h-5 w-5 text-${colour} opacity-${opacity}`} aria-hidden="true" />;
  const Off = ({ colour = "red-800", opacity = 100 }: any) => <XCircleIcon className={`h-5 w-5 text-${colour} opacity-${opacity}`} aria-hidden="true" />;

  const displayDay = (d: number) => (wd: WorkingDays) => {
    const handleChange = (e: any) => {
      if (wd.country !== country) return;
      e.stopPropagation();
      setChanging({ country: wd.country, day: d });

      fetcher.submit({ intent: "change-setting", workingDays: { id: wd.id, country: wd.country, days: wd.days }, day: d }, 
        { method: "POST", encType: "application/json" });
    };

    const isChanging = changing?.country === wd.country && changing?.day === d;

    const icon = wd.country === country
      ? wd.days.includes(d) 
        ? isChanging ? <Spinner size={4} /> : <On /> 
        : isChanging ? <Spinner size={4} /> : <Off opacity={60} />
      : wd.days.includes(d) ? <On opacity={50} colour="gray-500" /> : null;

      return <span onClick={handleChange}>{icon}</span>
    };

  const columns = [
    { name: "country", display: (wd: WorkingDays) => 
        <>
          <Flag isoCode={wd.country} size={8} className="inline mr-3" />
          <span className="font-medium">{wd.locality.name}</span>
        </>},
    ...Days.map(d => ({ name: format(setDay(today, d), 'iii'), display: displayDay(d) }))
  ];

  const actions = [
    { name: "select", onClick: handleSelect, row: true },
    { name: "remove", onClick: handleRemove },
  ];

  const hasPermission = (p: string) => u.permissions.includes(p);

  return (
    <Layout>
      <Heading heading="Working Days" explanation="Add countries where the standard working week differs from the norm, ie. Monday to Friday. Click to edit." />
      <Table data={workingDays} columns={columns} actions={actions} showHeadings={true} />

      {hasPermission(scheduler.create.schedule) && 
        <div className="flex pt-3">
          <Button icon={PlusIcon} title={t('Add a Country')} 
            type={ButtonType.Secondary} onClick={showCountriesModal} />
        </div>}
      <CountriesModal modal={modal} onSelect={handleSelectCountry}  />
    </Layout>
  );
};
