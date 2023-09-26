import { intlFormat } from 'date-fns';
import { useRef, useState } from 'react';
import { useNavigate, useSearchParams, useSubmit } from '@remix-run/react';
import { useTranslation } from 'react-i18next';
import { useLocale } from 'remix-i18next';

import { Country } from '~/models/countries.server';
import { type Holiday } from '~/models/scheduler/holidays.server';
import Alert, { Level } from '~/components/alert';
import ConfirmModal, { RefConfirmModal } from "~/components/modals/confirm";
import Tabs from '~/components/tabs';
import { List, ListItem, ListContext } from '~/components/list';

import classnames from '~/helpers/classnames';

type Props = {
  holidays: Array<Holiday>;
  country: Country;
  year: number;
  entity?: any;
  entityType?: string;
};

export default function Holidays({ holidays, country, year, entity, entityType }: Props) {
  const locale = useLocale();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const submit = useSubmit();
  const [ searchParams ] = useSearchParams();

  const confirm = useRef<RefConfirmModal>(null);
  const [ holiday, setHoliday ] = useState<Holiday>();

  const years = (year: number) => [...Array(5).keys()].map(index => year + index - 1);

  const tabs = years(new Date().getUTCFullYear())
    .map((year: number) => ({ name: year.toString() }));

  const handleClick = (year: string ) => {
    searchParams.set("year", year);
    navigate(`?${searchParams.toString()}`);
  };

  const reinstate = (holiday: Holiday) => {
    submit({ intent: "reinstate", holiday: { id: holiday.id, name: holiday.name }, entity: { ...entity, type: entityType }, year }, 
      { method: "post", encType: "application/json" });  
  };

  const remove = (holiday: Holiday) => {
    setHoliday(holiday);
    confirm.current?.show("Remove this Holiday?", "Yes, Remove", "Cancel", `Are you sure you want to remove ${holiday.name}?`);
  };

  const onConfirmRemove = () => {
    if (holiday === undefined) return;
    submit({ intent: "remove", holiday: { id: holiday.id, name: holiday.name }, entity: { ...entity, type: entityType }, year }, 
      { method: "post", encType: "application/json" });  
  };

  const Item = (holiday: Holiday) =>
    <>
      <div className={classnames(holiday.isRemoved ? "opacity-25" : "", "min-w-0 flex-auto")}>
        <p className={classnames(holiday.entity ? "text-gray-1000 font-semibold " : entity ? "text-gray-500" : "text-gray-900 font-semibold", "text-md leading-6")}>
          {holiday.name}
        </p>
        <p className={classnames(holiday.entity ? "text-gray-800" : entity ? "text-gray-400" : "text-gray-600", "mt-1 flex text-sm leading-5")}>
          {intlFormat(new Date(holiday.date), { year: 'numeric', month: 'long', day: 'numeric' }, { locale })}
        </p>
      </div>
    </>;
  
  const Context = (holiday: Holiday) => 
    <ListContext data={
      <div className="hidden group-hover:block">
        <button
          type="button"
          onClick={() => holiday.isRemoved ? reinstate(holiday) : remove(holiday)}
          className="inline-flex items-center gap-x-1.5 font-medium text-sm text-red-600 hover:text-red-500"
        >
          {holiday.isRemoved ? t('reinstate') : t('remove')}
        </button>
      </div>
    } select={false} />

  const noOp = () => null;

  return (
    <>
      <Tabs tabs={tabs} selected={year.toString()} onClick={handleClick} />

      {holidays.length === 0 && <Alert level={Level.Info} title={`No holidays for ${country.name}`} />}

      <List data={holidays} onClick={noOp} renderItem={Item} renderContext={Context} />
      <ConfirmModal ref={confirm} onYes={onConfirmRemove} />
    </>
  );
}
