import { useState } from 'react'
import { Switch } from '@headlessui/react'

import classnames from '~/helpers/classnames';

type Props = {
  name: string,
  on?: boolean,
  onChange?: Function
};

export default function Toggle({ name, on = false, onChange }: Props) {
  const [enabled, setEnabled] = useState(on);

  const handleChange = (value: boolean) => {
    setEnabled(value);
    onChange && onChange(name, value);
  };

  return (
    <Switch
      checked={enabled}
      onChange={handleChange}
      name={name}
      id={name}
      className={classnames(
        enabled ? 'bg-indigo-600' : 'bg-gray-200',
        'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2'
      )}
    >
      <span className="sr-only">Use setting</span>
      <span
        aria-hidden="true"
        className={classnames(
          enabled ? 'translate-x-5' : 'translate-x-0',
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
        )}
      />
    </Switch>
  )
}
