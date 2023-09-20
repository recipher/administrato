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

const years = (year: number) => [...Array(5).keys()].map(index => year + index - 1);

type Props = {
  holidays: Array<Holiday>;
  country: Country;
  year: number;
}

export default function Holidays({ holidays, country, year }: Props) {
  const locale = useLocale();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const submit = useSubmit();

  const confirm = useRef<RefConfirmModal>(null);
  const [ holiday, setHoliday ] = useState<Holiday>();
  
  const tabs = years(new Date().getUTCFullYear())
    .map((year: number) => ({ name: year.toString() }));

  const [ searchParams ] = useSearchParams();
  const qs = searchParams.toString() || '';
  const params = new URLSearchParams(qs);

  const handleClick = (year: string ) => {
    params.set("year", year);
    navigate(`?${params.toString()}`);
  };

  const remove = (holiday: Holiday) => {
    setHoliday(holiday);
    confirm.current?.show("Remove this Holiday?", "Yes, Remove", "Cancel", `Are you sure you want to remove ${holiday.name}?`);
  };

  const onConfirmRemove = () => {
    if (holiday === undefined) return;
    submit({ intent: "remove", holiday: { id: holiday.id, name: holiday.name }, year }, 
      { method: "post", encType: "application/json" });  
  };

  const Item = (holiday: Holiday) =>
    <ListItem data={holiday.name} sub={intlFormat(new Date(holiday.date), { year: 'numeric', month: 'long', day: 'numeric' }, { locale })} />

  const Context = (holiday: Holiday) => 
    <ListContext data={
      <div className="hidden group-hover:block">
        <button
          type="button"
          onClick={() => remove(holiday)}
          className="inline-flex items-center gap-x-1.5 font-medium text-sm text-red-600 hover:text-red-500"
        >
          {t('remove')}
        </button>
      </div>
    } chevron={false} />

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
