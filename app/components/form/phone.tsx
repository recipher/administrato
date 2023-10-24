import { useRef, useEffect, useState, Fragment } from "react";
import { useField } from "remix-validated-form";
import { Listbox, Transition } from '@headlessui/react'
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import parsePhoneNumber, { isValidPhoneNumber, AsYouType } from 'libphonenumber-js';

import ErrorMessage from './error';
import classnames from '~/helpers/classnames';

type Props = {
  name: string;
  label: string;
  value?: string;
  focus?: boolean;
  disabled?: boolean;
  placeholder?: string;
  width?: string;
  countries: Array<{ id: string; name: string; diallingCode: string}>;
};

type ItemProps = {
  id: string;
  name: string;
  image?: string;
  diallingCode: string;
};

type DataProps = Array<ItemProps>;

type SelectProps = {
  name: string;
  data?: DataProps;
  defaultValue?: ItemProps | undefined | null;
  value?: ItemProps | undefined | null;
  idKey?: string | undefined;
  onChange?: Function;
};

const noOp = () => null!

const Select = ({ data = [], defaultValue = null, value = null, onChange = noOp }: SelectProps) => {
  const [selected, setSelected] = useState<ItemProps | null>(defaultValue);

  const handleChange = (value: ItemProps) => {
    onChange(value);
    setSelected(value);
  };

  useEffect(() => {
    if (value) setSelected(value);
  }, [value]);

  return (
    <Listbox
      value={selected} onChange={handleChange}>
      {({ open }) => (
        <>
          <div className="relative">
            <Listbox.Button 
              className={classnames(
                selected?.image ? "pl-3" : "h-9",
                "text-gray-900 placeholder:text-gray-400 outline-none", 
                "relative w-[6rem] cursor-default rounded-md py-1.5 pr-2 text-left sm:text-sm sm:leading-6")}>
              <span className="flex items-center">
                <img src={selected?.image} alt={selected?.name} 
                  className={classnames(selected?.image ? "" : "hidden", "h-6 w-6 flex-shrink-0")} />
                <span className={classnames("ml-2.5 block truncate")}>{selected?.id}</span>
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
                <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </span>
            </Listbox.Button>

            <Transition
              show={open}
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute z-10 mt-1 max-h-56 w-[20rem] overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {data.map((item) => (
                  <Listbox.Option
                    key={item.id}
                    className={({ active }: { active: boolean }) =>
                      classnames(
                        active ? 'bg-indigo-600 text-white' : 'text-gray-900',
                        'relative cursor-default select-none py-2 pl-3 pr-9'
                      )} value={item}>
                    {({ selected, active }) => (
                      <>
                        <div className="flex items-center">
                          {item.image && <img src={item.image} alt={item.name} className="h-6 w-6 flex-shrink-0" />}
                          <span
                            className={classnames(
                              selected ? 'font-semibold' : 'font-normal',
                              item.image ? 'ml-3' : '', 'block truncate')}>
                            {item.name}
                          </span>
                          <span className={classnames(active 
                              ? "text-white" : "text-gray-500", "ml-2")}>
                            {item.diallingCode}
                          </span>
                        </div>

                        {selected ? (
                          <span
                            className={classnames(
                              active ? 'text-white' : 'text-indigo-600',
                              'absolute inset-y-0 right-0 flex items-center pr-4'
                            )}
                          >
                          </span>
                        ) : null}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </>
      )}
    </Listbox>
  )
};

export default function Input({ name, label, value, focus = false, disabled = false, placeholder, width, countries }: Props) {
  const { error, getInputProps } = useField(name);  
  const inputRef = useRef<HTMLInputElement>(null);
  const [ number, setNumber ] = useState(value);
  const [ country, setCountry ] = useState();
  const [ invalid, setInvalid ] = useState<string | undefined>();

  useEffect(() => {
    if (focus) inputRef.current?.focus();
  }, [focus]);

  const handleChangeCountry = ({ id, diallingCode }: any) => {
    setNumber(diallingCode + ' ');
    setCountry(id);
  };

  const handleChange = (e: any) => {
    e.preventDefault();
    const value = e.currentTarget?.value;
    setNumber(new AsYouType(country).input(value));
    setInvalid(isValidPhoneNumber(value, country) ? undefined : 'Not a valid number');
  };

  return (
    <div className="mb-2">
      <label htmlFor={name} className={classnames(
        disabled ? "text-gray-400" : "text-gray-900",
        "block text-sm font-medium leading-6")}>
        {label}
      </label>
      <div className={classnames(width ? `w-${width}` : "",
        "relative mt-1 rounded-md shadow-sm")}>
        <div className="absolute inset-y-0 left-0 flex items-center">
          <label htmlFor="country" className="sr-only">
            Country
          </label>
          <Select name="country" data={countries} onChange={handleChangeCountry} />
        </div>

        <input
          ref={inputRef} 
          disabled={disabled}
          placeholder={placeholder}
          {...getInputProps({ id: name, value: number })}
          defaultValue={value}
          onChange={handleChange}
          autoCorrect="off"
          autoCapitalize="off"
          autoComplete="off"
          type="tel"
          className={classnames(
            (error || invalid) ? "text-red-900 ring-red-300 focus:ring-red-500 placeholder:text-red-300" : "shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-600 ", 
            disabled ? "text-gray-400 bg-gray-100" : "",
            !(error || invalid) && !disabled ? "text-gray-900 bg-white": "",
            "block w-full rounded-md border-0 py-1.5 pl-[6rem] pr-10 ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6")}
        />
        {(error || invalid) && <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
        </div>}
      </div>
      <ErrorMessage name={name} error={error || invalid} />
    </div>
  );
};