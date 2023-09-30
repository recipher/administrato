import { useRef, useEffect } from "react";
import { useField } from "remix-validated-form";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

import ErrorMessage from './error';
import classnames from '~/helpers/classnames';

type Props = {
  name: string;
  label: string;
  value?: string;
  focus?: boolean;
  disabled?: boolean;
  placeholder?: string;
  rows?: number;
};

export default function Input({ name, label, value, focus = false, disabled = false, placeholder, rows = 4 }: Props) {
  const { error, getInputProps } = useField(name);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (error || focus) textareaRef.current?.focus();
  }, [focus, error]);

  return (
    <div className="mb-3">
      <label htmlFor={name} className={classnames(
        disabled ? "text-gray-400" : "text-gray-900",
        "block text-sm font-medium leading-6")}>
        {label}
      </label>
      <div className="relative mt-2 rounded-md shadow-sm">
        <textarea
          ref={textareaRef} 
          disabled={disabled}
          placeholder={placeholder}
          defaultValue={value}
          rows={rows}
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
      <ErrorMessage name={name} error={error} />
    </div>
  );
};
