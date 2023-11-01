import { useState } from 'react'
import { Combobox } from '@headlessui/react'
import { useField } from "remix-validated-form";
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

import ErrorMessage from './error';
import classnames from '~/helpers/classnames';

type ItemProps = {
  id: string;
  name: string;
  image?: string;
};
type DataProps = Array<ItemProps>;

type Props = {
  name: string;
  label: string;
  data?: DataProps;
  defaultValue?: DataProps;
};

export default function Combo({ name, label, data = [], defaultValue }: Props) {
  const { error, getInputProps } = useField(name);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(data.length ? data.at(0) : undefined);

  const filtered =
    query === ""
      ? data
      : data.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="mb-6">
      {/* @ts-ignore */}
      <Combobox as="div"
        // @ts-ignore
        {...getInputProps({ id: name })}
        value={selected} onChange={setSelected}>
        <Combobox.Label className="block text-sm font-medium leading-6 text-gray-900">
          {label}
        </Combobox.Label>
        <div className="relative mt-2">
          <Combobox.Input
            className={classnames(error ? "text-red-900 ring-red-300 focus:ring-red-500 placeholder:text-red-300" : "text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-600 ", 
              "block w-full rounded-md border-0 py-1.5 pr-10 ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6")}
            onChange={(event) => setQuery(event.target.value)}
            displayValue={(data: ItemProps) => data?.name}
            // displayValue={(data: DataProps) => data?.map((item) => item.name).join(', ')}
            />
          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
            {error 
              ? <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-1" aria-hidden="true" />
              : <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />}
          </Combobox.Button>
          <Combobox.Options className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {query.length > 0 && (
              <Combobox.Option className='relative cursor-pointer select-none py-2 pl-3 pr-9 text-gray-900'
                key={query} value={{ id: query, name: query }}> 
                <span className='truncate'>
                  Create <span className="text-medium">{query}</span>
                </span>
              </Combobox.Option>
            )}
            {filtered.length > 0 && filtered.map(item => (
              <Combobox.Option
                key={item.id}
                value={item}
                className={({ active }) =>
                  classnames(
                    'relative cursor-default select-none py-2 pl-3 pr-9',
                    active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                  )
                }
              >
                {({ active, selected }) => (
                  <>
                    <div className="flex items-center">
                      {item.image && <img src={item.image} alt={item.name} className="h-6 w-6 flex-shrink-0" />}
                      <span className={classnames(item.image ? 'ml-3' : '', 'truncate', selected ? "font-medium" : "")}>
                        {item.name}
                      </span>
                    </div>

                    {/* {selected && (
                      <span
                        className={classnames(
                          'absolute inset-y-0 right-0 flex items-center pr-4',
                          active ? 'text-white' : 'text-indigo-600'
                        )}
                      >
                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    )} */}
                  </>
                )}
              </Combobox.Option>
            ))}
          </Combobox.Options>
        </div>
      </Combobox>
      <ErrorMessage name={name} error={error} />
    </div>
  )
}
