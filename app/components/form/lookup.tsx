import { useRef, useEffect } from "react";
import { useField } from "remix-validated-form";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

import classnames from '~/helpers/classnames';
import Hidden from "./hidden";
import Button, { ButtonType } from "../button";

type Props = {
  name: string;
  label: string;
  value?: string | number | undefined;
  text: string;
  disabled?: boolean;
  icon?: any;
  onClick: Function;
};

export default function Lookup({ name, label, text, value, icon, disabled = false, onClick }: Props) {
  const { error, getInputProps } = useField(name);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="mb-3">
      <label htmlFor={name} className={classnames(
        disabled ? "text-gray-400" : "text-gray-900",
        "block text-sm font-medium leading-6")}>
        {label}
      </label>
      <div className="relative mt-2 rounded-md shadow-sm">
        <input
          disabled={disabled}
          value={value}
          name={name}
          type="hidden"
          {...getInputProps({ id: name })}
        />
        <Button title={text} 
          icon={icon} 
          type={ButtonType.Secondary} 
          onClick={() => onClick()} />
      </div>
      {error && <p className="mt-2 text-sm text-red-600" id={`${name}-error`}>
        {error}
      </p>}
    </div>
  );
};