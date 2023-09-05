import { Form, useSearchParams } from '@remix-run/react';
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import Sort from './sort';
import classnames from '~/helpers/classnames';

type Props = {
  title: string;
  subtitle?: string;
  filterTitle: string;
  filterParam: string;
  allowSort?: boolean;
};

export default function Header({ title, subtitle, filterTitle, filterParam, allowSort }: Props) {
  const [ searchParams ] = useSearchParams();
  const filter = searchParams.get(filterParam) || '';
  const sort = searchParams.get('sort');

  return (
    <div className="border-b border-gray-200 pb-5 sm:flex sm:items-center sm:justify-between">
      <h3 className="text-xl font-semibold leading-6 text-gray-900">{title}</h3>
      <div className="mt-3 sm:ml-4 sm:mt-0">
        <label htmlFor="search" className="sr-only">
          Search
        </label>
        <div className="flex rounded-md shadow-sm">
          <div className="relative flex-grow focus-within:z-10">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <Form method="get">
              <input
                type="search"
                name={filterParam}
                id="search"
                className={classnames(allowSort ? "" : "rounded-r-md", "w-full rounded-none rounded-l-md border-0 py-1.5 pl-10 text-sm leading-6 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 block")}
                placeholder={filterTitle}
                autoComplete="off"
                autoCapitalize="off"
                defaultValue={filter}
              />
              <input type="submit" hidden />
            </Form>
          </div>
          {allowSort && <Sort sort={sort} />}
        </div>
      </div>
    </div>
  );
}
