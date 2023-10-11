import { useRef } from "react";
import { type LoaderArgs, type ActionArgs, json } from "@remix-run/node";
import { useLoaderData, useSubmit } from "@remix-run/react";
import { format, setDay } from 'date-fns';
import { useTranslation } from "react-i18next";

import { PlusIcon } from "@heroicons/react/24/outline";

import { requireUser } from "~/auth/auth.server";
import { useUser } from "~/hooks";

import WorkingDayService, { create, type WorkingDays, type Country } from '~/services/scheduler/working-days.server';

import { Table, Button, ButtonType } from '~/components';
import { Layout, Heading } from '~/components/info/info';
import { CountriesModal } from "~/components/countries/countries";
import { RefModal } from "~/components/modals/modal";

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";

import { scheduler } from '~/auth/permissions';

export const handle = {
  name: "settings",
  breadcrumb: ({ current, name }: BreadcrumbProps) => 
    <Breadcrumb to='/schedules/settings' name={name} current={current} />
};

const days = [ ...Array(7).keys() ];

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
    const { country } = data;

    await service.saveWorkingDays(create({ country }));
  }

  return null;
};

export default () => {
  const today = new Date();
  const { t } = useTranslation();
  const u = useUser();
  const modal = useRef<RefModal>(null);

  const submit = useSubmit();
  const { workingDays } = useLoaderData();
     
  const showCountriesModal = () => modal.current?.show();
  const handleSelectCountry = (country: Country) => {
    submit({ intent: "save-country", country: country.isoCode }, { method: "POST", encType: "application/json" });
  };

  const columns = [
    { name: "country", display: (wd: WorkingDays) => wd.locality.name },
    ...days.map(d => ({ name: format(setDay(today, d), 'iii'), display: (wd: WorkingDays) => wd.days.includes(d) ? "yes" : "" }))
  ];

  const actions = [
    { name: "save", onClick: (wds: WorkingDays) => alert(wds.days) },
  ];

  const hasPermission = (p: string) => u.permissions.includes(p);

  return (
    <Layout>
      <Heading heading="Working Days" explanation="Add countries where the standard working week differs from the norm, ie. Monday to Friday." />
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
