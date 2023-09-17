import { ChangeEventHandler } from "react";
import { useField } from "remix-validated-form";

import classnames from '~/helpers/classnames';

type Props = {
  checked?: boolean;
  name: string;
  label: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
};

export default function Checkbox ({ checked = false, name, label, onChange = null! }: Props) {
  const { error, getInputProps } = useField(name);
  return (
    <div className="relative flex items-start">
      <div className="flex h-6 items-center">
        <input
          aria-describedby={`${name}-description`}
          name={name}
          defaultChecked={checked}          
          {...getInputProps({ id: name, type: "checkbox" })}
          onChange={onChange}
          className={classnames(
            error ? "border-red-900 text-red-600 focus:ring-red-600" : "border-gray-300 text-indigo-600",
            "h-4 w-4 rounded focus:ring-indigo-600")}
        />
      </div>
      <div className="ml-3 text-sm leading-6">
        <label htmlFor={name} className="font-medium text-gray-900">
          {label}
        </label>
      </div>
    </div>
  );
}