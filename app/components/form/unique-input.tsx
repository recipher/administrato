import { useRef, useEffect, ChangeEvent, useState } from "react";
import { useFetcher } from "@remix-run/react";
import { useField } from "remix-validated-form";
import { useDebounce } from "use-debounce";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

import ErrorMessage from './error';
import classnames from '~/helpers/classnames';

type Props = {
  name: string;
  label: string;
  value?: string | undefined;
  focus?: boolean;
  disabled?: boolean;
  placeholder?: string;
  checkUrl: string;
  property: string;
  message?: string;
};

export default function Input({ name, label, value, focus = false, disabled = false, 
  placeholder, checkUrl, property, message = "Taken" }: Props) {
  const { error, getInputProps } = useField(name);
  const [ currentValue, setCurrentValue ] = useState(value);
  const [ debouncedValue ] = useDebounce(currentValue, 500);
  const [ exists, setExists ] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetcher = useFetcher();

  useEffect(() => {
    if (error || focus) inputRef.current?.focus();
  }, [focus, error]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") setExists(null);
    setCurrentValue(value);
  };

  useEffect(() => {
    if (debouncedValue && !disabled) fetcher.load(`${checkUrl}/${debouncedValue}?bypass=true`);
  }, [ debouncedValue ]);

  useEffect(() => {
    if (fetcher.data?.[property]) setExists(message);
    else setExists(null);
  }, [ fetcher.data ]);

  return (
    <div className="mb-6">
      <label htmlFor={name} className={classnames(
        disabled ? "text-gray-400" : "text-gray-900",
        "block text-sm font-medium leading-6")}>
        {label}
      </label>
      <div className="relative mt-2 rounded-md shadow-sm">
        <input
          ref={inputRef} 
          // disabled={disabled}
          placeholder={placeholder}
          // value={value}
          {...getInputProps({ id: name })}
          defaultValue={value}
          autoCorrect="off"
          autoCapitalize="off"
          autoComplete="off"
          type="text"
          onChange={handleChange}
          className={classnames(
            (error || exists) ? "text-red-900 ring-red-300 focus:ring-red-500 placeholder:text-red-300" : "shadow-sm ring-gray-300 placeholder:text-gray-400", 
            disabled ? "text-gray-400 bg-gray-100 select-none ring-gray-300 focus:ring-gray-300" : "focus:ring-2 focus:ring-inset focus:ring-indigo-600",
            !error && !exists && !disabled ? "text-gray-900 bg-white": "",
            "block w-full rounded-md border-0 py-1.5 pr-10 ring-1 ring-inset sm:text-sm sm:leading-6")}
        />
        {(error || exists) && <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
        </div>}
        {!exists && !error && !disabled && currentValue && <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <CheckCircleIcon className="h-5 w-5 text-green-500" aria-hidden="true" />
        </div>}
      </div>
      <ErrorMessage name={name} error={error} />
      {exists !== error && <ErrorMessage name={name} error={exists} type="exists" />}
    </div>
  );
};