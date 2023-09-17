import { useRef, useEffect } from "react";
import { useField } from "remix-validated-form";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

import classnames from '~/helpers/classnames';

type Props = {
  name: string;
  label: string;
  value?: string;
  focus?: boolean;
  disabled?: boolean;
  placeholder?: string;
};

export default function Input({ name, label, value, focus = false, disabled = false, placeholder }: Props) {
  const { error, getInputProps } = useField(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (error || focus) inputRef.current?.focus();
  }, [focus, error]);

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
          disabled={disabled}
          placeholder={placeholder}
          value={value}
          {...getInputProps({ id: name })}
          autoCorrect="off"
          autoCapitalize="off"
          autoComplete="off"
          className={classnames(
            error ? "text-red-900 ring-red-300 focus:ring-red-500 placeholder:text-red-300" : "shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-600 ", 
            disabled ? "text-gray-400 bg-gray-100" : "",
            !error && !disabled ? "text-gray-900 bg-white": "",
            "block w-full rounded-md border-0 py-1.5 pr-10 ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6")}
        />
        {error && <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
        </div>}
      </div>
      {error && <p className="mt-2 text-sm text-red-600" id={`${name}-error`}>
        {error}
      </p>}
    </div>
  );
};