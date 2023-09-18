import { useRef, useEffect } from "react";
import { useField } from "remix-validated-form";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

import classnames from '~/helpers/classnames';

type Props = {
  name: string;
  label: string;
  value?: string | number | undefined;
  disabled?: boolean;
};

export default function Input({ name, label, value, disabled = false }: Props) {
  const { getInputProps } = useField(name);

  return (
    <div className="mb-3">
      <label htmlFor={name} className={classnames(
        disabled ? "text-gray-400" : "text-gray-900",
        "block text-sm font-medium leading-6")}>
        {label}
      </label>
      <div className="relative">
        <input
          disabled={disabled}
          value={value}
          type="hidden"
          {...getInputProps({ id: name })}
        />
      </div>
    </div>
  );
};