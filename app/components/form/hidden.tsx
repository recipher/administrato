import { useField } from "remix-validated-form";

import classnames from '~/helpers/classnames';

type Props = {
  name: string;
  value?: string | number | undefined;
  disabled?: boolean;
};

export default function Input({ name, value, disabled = false }: Props) {
  const { getInputProps } = useField(name);

  return (
    <input
      disabled={disabled}
      value={value}
      type="hidden"
      {...getInputProps({ id: name })}
    />
  );
};