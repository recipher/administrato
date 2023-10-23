import { Fragment, useState, useEffect } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { useField } from 'remix-validated-form';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'

import ErrorMessage from './error';
import classnames from '~/helpers/classnames';

type ItemProps = {
  id: string;
  name: string;
  image?: string;
};

export type SelectItem = ItemProps;

type DataProps = Array<ItemProps>;

type Props = {
  name: string;
  label: string;
  data?: DataProps;
  defaultValue?: SelectItem | undefined | null;
  value?: SelectItem | undefined | null;
  idKey?: string | undefined;
  onChange?: Function;
};

const noOp = () => null!

export default function Select({ name, label, data = [], defaultValue = null, value = null, idKey = "id", onChange = noOp }: Props) {
  const { error, getInputProps } = useField(name);
  const [selected, setSelected] = useState<ItemProps | null>(defaultValue);

  const handleChange = (value: ItemProps) => {
    onChange(value);
    setSelected(value);
  };

  useEffect(() => {
    if (value) setSelected(value);
  }, [value]);

  return (
    <>
      {/* @ts-ignore */}
      <Listbox
        // @ts-ignore
        {...getInputProps({ id: name })}
        value={selected} onChange={handleChange}>
        {({ open }) => (
          <>
            <Listbox.Label className="block text-sm font-medium leading-6 text-gray-900">
              {label}
            </Listbox.Label>
            <div className="relative mt-1">
              <Listbox.Button 
                className={classnames(
                  selected?.image ? "pl-3" : "h-9",
                  error ? "text-red-900 ring-red-300 focus:ring-red-500 placeholder:text-red-300" : "text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500", 
                  "relative w-full cursor-default rounded-md bg-white py-1.5 pr-10 text-left ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6")}>
                <span className="flex items-center">
                  <img src={selected?.image} alt={selected?.name} 
                    className={classnames(selected?.image ? "" : "hidden", "h-6 w-6 flex-shrink-0")} />
                  <span className={classnames("ml-3 block truncate")}>{selected?.name}</span>
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
                  <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </span>
              </Listbox.Button>

              <Transition
                show={open}
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                  {data.map((item) => (
                    <Listbox.Option
                      key={item.id}
                      className={({ active }: { active: boolean }) =>
                        classnames(
                          active ? 'bg-indigo-600 text-white' : 'text-gray-900',
                          'relative cursor-default select-none py-2 pl-3 pr-9'
                        )
                      }
                      value={item}
                    >
                      {({ selected, active }) => (
                        <>
                          <div className="flex items-center">
                            {item.image && <img src={item.image} alt={item.name} className="h-6 w-6 flex-shrink-0" />}
                            <span
                              className={classnames(
                                selected ? 'font-semibold' : 'font-normal',
                                item.image ? 'ml-3' : '',
                                'block truncate')}
                            >
                              {item.name}
                            </span>
                          </div>

                          {selected ? (
                            <span
                              className={classnames(
                                active ? 'text-white' : 'text-indigo-600',
                                'absolute inset-y-0 right-0 flex items-center pr-4'
                              )}
                            >
                              <CheckIcon className="h-5 w-5" aria-hidden="true" />
                            </span>
                          ) : null}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          </>
        )}
      </Listbox>
      <ErrorMessage name={name} error={error} />
    </>
  )
}
