import { useRef, useEffect } from "react";
import { useField } from "remix-validated-form";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

import ErrorMessage from './error';
import classnames from '~/helpers/classnames';

type Props = {
  name: string;
  label?: string;
  value?: string;
  focus?: boolean;
  disabled?: boolean;
  placeholder?: string;
  type?: string | undefined;
  width?: string;
  pre?: string | undefined
};

export default function Input({ name, label, value, focus = false, disabled = false, placeholder, type = "text", width, pre }: Props) {
  const { error, getInputProps } = useField(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focus) inputRef.current?.focus();
  }, [focus]);

  return (
    <div className="mb-2">
      {label && <label htmlFor={name} className={classnames(
        disabled ? "text-gray-400" : "text-gray-900",
        "block text-sm font-medium leading-6")}>
        {label}
      </label>}
      <div className={classnames(width ? `w-${width}` : "",
            "mt-1 relative flex rounded-md shadow-sm ring-1 ring-inset focus-within:ring-2 focus-within:ring-inset sm:max-w-md",
            error ? "text-red-900 ring-red-300 focus:ring-red-500 focus-within:ring-red-500 placeholder:text-red-300" : "ring-gray-300 placeholder:text-gray-400 focus-within:ring-indigo-600 focus:ring-indigo-600 ")}>
        {pre && <span className="flex select-none items-center pl-3 text-gray-500 sm:text-sm">{pre}</span>}
        <input
          ref={inputRef} 
          disabled={disabled}
          placeholder={placeholder}
          defaultValue={value}
          {...getInputProps({ id: name })}
          autoCorrect="off"
          autoCapitalize="off"
          autoComplete="off"
          type={type}
          className={classnames(
            disabled ? "text-gray-400 bg-gray-100" : "",
            !error && !disabled ? "text-gray-900": "",
            pre ? "pl-1" : "pl-3",
            "block flex-1 border-0 bg-transparent py-1.5 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6")}
        />
        {error && <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
        </div>}
      </div>
      <ErrorMessage name={name} error={error} />
    </div>
  );
};