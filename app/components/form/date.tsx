import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useField } from 'remix-validated-form';
import { format, addMonths } from 'date-fns';

import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/20/solid'

import classnames from '~/helpers/classnames';

const dates = [
  { date: '2021-12-27' },
  { date: '2021-12-28' },
  { date: '2021-12-29' },
  { date: '2021-12-30' },
  { date: '2021-12-31' },
  { date: '2022-01-01', isCurrentMonth: true },
  { date: '2022-01-02', isCurrentMonth: true },
  { date: '2022-01-03', isCurrentMonth: true },
  { date: '2022-01-04', isCurrentMonth: true },
  { date: '2022-01-05', isCurrentMonth: true },
  { date: '2022-01-06', isCurrentMonth: true },
  { date: '2022-01-07', isCurrentMonth: true },
  { date: '2022-01-08', isCurrentMonth: true },
  { date: '2022-01-09', isCurrentMonth: true },
  { date: '2022-01-10', isCurrentMonth: true },
  { date: '2022-01-11', isCurrentMonth: true },
  { date: '2022-01-12', isCurrentMonth: true, isToday: true },
  { date: '2022-01-13', isCurrentMonth: true },
  { date: '2022-01-14', isCurrentMonth: true },
  { date: '2022-01-15', isCurrentMonth: true },
  { date: '2022-01-16', isCurrentMonth: true },
  { date: '2022-01-17', isCurrentMonth: true },
  { date: '2022-01-18', isCurrentMonth: true },
  { date: '2022-01-19', isCurrentMonth: true },
  { date: '2022-01-20', isCurrentMonth: true },
  { date: '2022-01-21', isCurrentMonth: true },
  { date: '2022-01-22', isCurrentMonth: true, isSelected: true },
  { date: '2022-01-23', isCurrentMonth: true },
  { date: '2022-01-24', isCurrentMonth: true },
  { date: '2022-01-25', isCurrentMonth: true },
  { date: '2022-01-26', isCurrentMonth: true },
  { date: '2022-01-27', isCurrentMonth: true },
  { date: '2022-01-28', isCurrentMonth: true },
  { date: '2022-01-29', isCurrentMonth: true },
  { date: '2022-01-30', isCurrentMonth: true },
  { date: '2022-01-31', isCurrentMonth: true },
  { date: '2022-02-01' },
  { date: '2022-02-02' },
  { date: '2022-02-03' },
  { date: '2022-02-04' },
  { date: '2022-02-05' },
  { date: '2022-02-06' },
];

type CalendarProps = {
  date?: Date;
  onSelect: Function;
};

const DAYS = [ 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday' ];

export function Calendar({ date = new Date(), onSelect }: CalendarProps) {
  const { t } = useTranslation("date");

  const [ current, setCurrent ] = useState(date);

  const month = format(current, "MMMM");
  const year = format(current, "yyyy");

  const onPrevious = () => setCurrent(addMonths(current, -1));
  const onNext = () => setCurrent(addMonths(current, 1));

  return (
    <div>
      <div className="p-3">
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
            {DAYS.map(d => <div>{t(d).at(0)}</div>)}
          </div>
          <div className="isolate mt-2 grid grid-cols-7 gap-px rounded-lg bg-gray-200 text-sm shadow ring-1 ring-gray-200">
            {dates.map((day, dayIdx) => (
              <button
                key={day.date}
                type="button"
                onClick={() => onSelect(new Date(day.date))}
                className={classnames(
                  'py-1 hover:bg-gray-100 focus:z-10',
                  day.isCurrentMonth ? 'bg-white' : 'bg-gray-50',
                  (day.isSelected || day.isToday) && 'font-semibold',
                  day.isSelected && 'text-white',
                  !day.isSelected && day.isCurrentMonth && !day.isToday && 'text-gray-900',
                  !day.isSelected && !day.isCurrentMonth && !day.isToday && 'text-gray-400',
                  day.isToday && !day.isSelected && 'text-indigo-600',
                  dayIdx === 0 && 'rounded-tl-lg',
                  dayIdx === 6 && 'rounded-tr-lg',
                  dayIdx === dates.length - 7 && 'rounded-bl-lg',
                  dayIdx === dates.length - 1 && 'rounded-br-lg'
                )}
              >
                <time
                  dateTime={day.date}
                  className={classnames(
                    'mx-auto flex h-7 w-7 items-center justify-center rounded-full',
                    day.isSelected && day.isToday && 'bg-indigo-600',
                    day.isSelected && !day.isToday && 'bg-gray-500'
                  )}
                >
                  {day.date.split('-').pop().replace(/^0/, '')}
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
  label?: string;
  name?: string;
  placeholder?: string;
  defaultValue?: Date;
};

export default function DatePicker({ label = 'Select Date', name = 'date', placeholder, defaultValue }: Props) {
  const { error, getInputProps } = useField(name);

  const [ open, setOpen ] = useState(false);
  const [ date, setDate ] = useState(defaultValue);

  const handleSelect = (d: Date) => {
    setDate(d);
    setOpen(false);
  };

  return (
    <>
      <div className="mb-6">
        <label htmlFor="date" className="block text-sm font-medium leading-6 text-gray-900">
          {label}
        </label>
        <div className="inline-block relative mt-2 rounded-md shadow-sm">
          <input
            type="text"
            {...getInputProps({ id: name })}
            placeholder={placeholder}
            value={date?.toLocaleDateString()}
            className={classnames(
              error ? "text-red-900 ring-red-300 focus:ring-red-500 placeholder:text-red-300" : "text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-600 ", 
              "block w-full rounded-md border-0 py-1.5 pr-10 ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6")}
          />
          <div className="group absolute inset-y-0 right-0 flex items-center cursor-pointer" onClick={() => setOpen(!open)}>
            <CalendarDaysIcon className="mx-2 h-5 w-5 text-gray-400 group-hover:text-indigo-400" aria-hidden="true" />
          </div>
        </div>
        <div className={classnames(open ? "block" : "hidden", "absolute")}>
          <div className="z-10 w-[24rem] mt-2 bg-white divide-y divide-gray-100 rounded-lg shadow w-44 dark:bg-gray-700">
            <Calendar date={date} onSelect={handleSelect} />
          </div>
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-red-600" id={`${name}-error`}>
        {error}
      </p>}
    </>
  );
}
