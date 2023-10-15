import { ChangeEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useField } from 'remix-validated-form';
import { useLocale } from 'remix-i18next';
import { format, addMonths, addDays, lastDayOfMonth, 
         isSameDay, isSameMonth, isSameYear, isToday } from 'date-fns';

import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/20/solid'

import ErrorMessage from './error';
import classnames from '~/helpers/classnames';

type CalendarProps = {
  date: Date | undefined;
  onSelect (d: Date): void;
};

const DAYS = [ 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday' ];

type CalendarDate = {
  date: Date;
  during?: boolean;
  selected?: boolean;
  today?: boolean;
};

const isSameDate = (d: Date, date: Date) => 
  isSameYear(d, date) && isSameMonth(d, date) && isSameDay(d, date);

const datesFor = (date: Date, selected: Date) => {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const last = lastDayOfMonth(date);

  const toDate = (d: Date) => ({
    date: d,
    selected: isSameDate(d, selected),
    today: isToday(d),
  });

  const length = first.getDay() === 0 ? 6 : first.getDay() - 1;

  const before = [...Array(length).keys()].reverse().map(day => toDate(addDays(first, (day + 1) * -1)));
  const during = [...Array(last.getDate()).keys()].map(day => ({ during: true, ...toDate(addDays(first, day)) }));
  const after = [...Array(7 - last.getDay()).keys()].map(day => toDate(addDays(last, day + 1)));

  return [ ...before, ...during, ...after ].flat() as Array<CalendarDate>;
};

export function Calendar({ date = new Date(), onSelect }: CalendarProps) {
  const { t } = useTranslation("date");

  const [ current, setCurrent ] = useState(date);

  const month = format(current, "MMMM");
  const year = format(current, "yyyy");
  const dates = datesFor(current, date);

  const onPrevious = () => setCurrent(addMonths(current, -1));
  const onNext = () => setCurrent(addMonths(current, 1));

  return (
    <div className="z-10">
      <div className="p-3 bg-gray-100 rounded-md">
        <div className="text-center lg:col-start-0 lg:col-end-6 lg:row-start-1">
          <div className="flex items-center text-gray-900">
            <button
              type="button"
              onClick={onPrevious}
              className="-m-1.5 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Previous month</span>
              <ChevronLeftIcon className="h-6 w-6" aria-hidden="true" />
            </button>
            <div className="flex-auto text-md font-medium">{t(month)} {year}</div>
            <button
              type="button"
              onClick={onNext}
              className="-m-1.5 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Next month</span>
              <ChevronRightIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-6 grid grid-cols-7 text-xs leading-6 text-gray-500">
            {DAYS.map(d => <div key={d}>{t(d).at(0)}</div>)}
          </div>
          <div className="isolate mt-2 grid grid-cols-7 gap-px rounded-lg bg-gray-200 text-sm shadow ring-1 ring-gray-200">
            {dates.map((day, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onSelect(day.date)}
                className={classnames(
                  'py-1 hover:bg-gray-100 focus:z-10',
                  day.during ? 'bg-white' : 'bg-gray-50',
                  // @ts-ignore
                  (day.selected || day.today) && 'font-semibold',
                  day.selected && 'text-white',
                  !day.selected && day.during && !day.today && 'text-gray-900',
                  !day.selected && !day.during && !day.today && 'text-gray-400',
                  day.today && !day.selected && 'text-indigo-600',
                  i === 0 && 'rounded-tl-lg',
                  i === 6 && 'rounded-tr-lg',
                  i === dates.length - 7 && 'rounded-bl-lg',
                  i === dates.length - 1 && 'rounded-br-lg'
                )}
              >
                <time
                  dateTime={format(day.date, 'yyyy-mm-dd')}
                  className={classnames(
                    'mx-auto flex h-7 w-7 items-center justify-center rounded-full',
                    // @ts-ignore
                    day.selected && day.today && 'bg-indigo-600',
                    day.selected && !day.today && 'bg-gray-500'
                  )}
                >
                  {day.date.getDate()}
                </time>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
};

type Props = {
  label?: string | null;
  name?: string;
  placeholder?: string;
  value?: Date;
  defaultValue?: Date;
  displayFormat?: string;
  width?: number;
  onChange? (d: Date): void;
};

const noOp = () => null!

export default function DatePicker({ label = 'Select Date', name = 'date', placeholder, value, defaultValue, displayFormat = "dd MMMM yyyy", width = 16, onChange = noOp }: Props) {
  const locale = useLocale();

  const { error, getInputProps } = useField(name);

  const [ open, setOpen ] = useState(false);
  const [ date, setDate ] = useState<Date | undefined>(value);

  const handleSelect = (d: Date) => {
    setDate(d);
    setOpen(false);
    onChange(d);
  };

  const handleClick = (e: any) => {
    e.stopPropagation();
    setOpen(!open);
  };

  return (
    <>
      {label && <label htmlFor="date" className="block text-sm font-medium leading-6 text-gray-900">
        {label}
      </label>}
      <div className="inline-block relative mt-2 rounded-md shadow-sm">
        <input
          type="text"
          {...getInputProps({ id: name })}
          placeholder={placeholder}
          value={(date && format(date, displayFormat)) || ""}
          className={classnames(`w-[${width}rem]`,
            error ? "text-red-900 ring-red-300 focus:ring-red-500 placeholder:text-red-300" : "text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-600 ", 
            "block rounded-md border-0 py-1.5 pr-10 ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6")}
        />
        <div className="group absolute inset-y-0 right-0 flex items-center cursor-pointer" onClick={handleClick}>
          <CalendarDaysIcon className="mx-2 h-5 w-5 text-gray-400 group-hover:text-indigo-400" aria-hidden="true" />
        </div>
      </div>
      <div className={classnames(open ? "block" : "hidden", "z-10 absolute")}>
        <div className={classnames(`w-[24rem]`, "mt-2 bg-white divide-y divide-gray-100 rounded-lg shadow")}>
          <Calendar date={date || defaultValue} onSelect={handleSelect} />
        </div>
      </div>
      <ErrorMessage name={name} error={error} />
    </>
  );
}
