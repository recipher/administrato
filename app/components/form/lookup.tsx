import { useField } from "remix-validated-form";

import ErrorMessage from "./error";
import classnames from '~/helpers/classnames';

type Props = {
  name: string;
  label: string;
  value?: {
    id: string;
    name?: string;
  } | undefined;
  placeholder?: string;
  disabled?: boolean;
  icon?: any;
  onClick: Function;
};

export default function Lookup({ name, label, value, placeholder, ...props }: Props) {
  const { error, getInputProps } = useField(name);

  return (
    <div className="mb-3">
      <label htmlFor={name} className={classnames(
        props.disabled ? "text-gray-400" : "text-gray-900",
        "block text-sm font-medium leading-6")}>
        {label}
      </label>
      <>
        <input
          value={value?.id}
          name={name}
          type="hidden"
          {...getInputProps({ id: name })}
        />
        <div className="relative mt-2 rounded-md shadow-sm" onClick={() => props.onClick()}>
          <input
            type="text"
            name={`${name}-display`}
            placeholder={placeholder}
            value={value?.name}
            disabled={true}
            className={classnames(
              error ? "text-red-900 ring-red-300 focus:ring-red-500 placeholder:text-red-300" : "text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-600 ", 
              "block w-full rounded-md border-0 py-1.5 pr-10 ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6")}
          />
          <div className={classnames(props.disabled ? "" : "cursor-pointer", "group absolute inset-y-0 right-0 flex items-center")}>
            {props.icon && <props.icon className={classnames(props.disabled ? "" : "hover:text-indigo-500", "-ml-0.5 mr-2 h-5 w-5 text-gray-500")} aria-hidden="true" />}
          </div>
        </div>
      </>
      <ErrorMessage name={name} error={error} />
    </div>
  );
};