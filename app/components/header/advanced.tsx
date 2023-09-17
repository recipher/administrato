import { Fragment, ReactNode } from 'react';
import { Form, useNavigate, useSearchParams } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

import { Menu, Transition } from '@headlessui/react';
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import { ChevronDownIcon } from '@heroicons/react/24/outline';

import Tabs, { TabsProps } from '../navigation-tabs';
import Actions, { ActionsProps } from '../actions';
import ButtonGroup from '../button-group';
import Image from '../image';

import Sort from './sort';
import classnames from '~/helpers/classnames';

type TitleProps = {
  title: string;
  subtitle?: string | undefined;
  icon?: ReactNode | string | undefined;
};
type FilterProps = {
  filterTitle?: string;
  filterParam?: string;
  allowSort?: boolean;
};
type AdditionalFilterOptions = {
  name: string;
  value: string;
};
type AdditionalFilterProps = {
  title: string;
  filters: Array<AdditionalFilterOptions>;
  filterParam: string;
  selected: string;
};
type ButtonsProps = {
  actions?: ActionsProps;
  group?: boolean;
};
type Props = {
  additionalFilters?: AdditionalFilterProps;
  tabs?: TabsProps;
} & TitleProps & FilterProps  & ButtonsProps;

const Title = ({ title, subtitle, icon }: TitleProps) => {
  const { t } = useTranslation();
  return (
    <>
      {icon && <div className="mr-4 flex-shrink-0">{icon}</div>}
      <div className="h-6">
        <h3 className="text-lg font-semibold leading-6 text-gray-900">{t(title)}</h3>
        {subtitle && <p className="text-sm text-gray-500">
          {t(subtitle)}
        </p>}
      </div>
    </>
  );
}

const AdditionalFilter = ({ title, filters, filterParam, selected }: AdditionalFilterProps) => {
  const [ searchParams ] = useSearchParams();
  const navigate = useNavigate();

  if (filters.length === 0) return null;

  const selectedName = selected && filters.find(({ value }) => value == selected)?.name;

  const navigateTo = (value: any) => {
    const qs = searchParams.toString() || '';
    const params = new URLSearchParams(qs);
    params.set(filterParam, value);
    navigate(`?${params.toString()}`);
  };

  return (
    <Menu as="div" className="relative inline-block text-left focus:outline-none">
      <div>
        <Menu.Button className="group inline-flex justify-center text-md font-medium text-gray-700 hover:text-gray-900 focus:outline-none">
          {title}
          {selectedName && <span className="font-semibold ml-2">{selectedName}</span>}
          <ChevronDownIcon
            className="-mr-1 ml-1 mt-1 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500"
            aria-hidden="true"
          />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute left-0 z-10 mt-2 w-40 origin-top-left rounded-md bg-white shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {filters.map((filter) => (
              <Menu.Item key={filter.name}>
                {({ active }) => (
                  <div
                    onClick={() => navigateTo(filter.value || filter.name)}
                    className={classnames(
                      filter.value == selected ? 'font-medium text-gray-900' : 'text-gray-500',
                      active ? 'bg-gray-100' : '',
                      'block px-4 py-2 text-sm cursor-pointer'
                    )}
                  >
                    {filter.name}
                  </div>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

const Filter = ({ filterTitle, filterParam, allowSort, sort, filter, additionalFilters }: FilterProps & { sort: string | null, filter: string, additionalFilters?: AdditionalFilterProps | undefined }) => {
  const { t } = useTranslation();
  return (
    <>
      <label htmlFor="search" className="sr-only">
        {t('search')}
      </label>
      <div className="flex rounded-md shadow-sm mb-3">
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
              autoCorrect="off"
              defaultValue={filter}
            />
            <input type="submit" hidden />
            {additionalFilters && 
              <input type="hidden" name={additionalFilters.filterParam} value={additionalFilters.selected} />}
          </Form>
        </div>
        {allowSort && <Sort sort={sort} />}
      </div>
    </>
  );
}

const Buttons = ({ actions = [], group = false }: ButtonsProps) => {
  return group
    ? <ButtonGroup buttons={actions} title='' /> 
    : <Actions actions={actions} />
}

export default function Header({ title, subtitle, icon, tabs = [], actions = [], additionalFilters,
  filterTitle, filterParam = 'q', allowSort = true, group = false }: Props) {

  const [ searchParams ] = useSearchParams();
  const filter = searchParams.get(filterParam) || '';
  const sort = searchParams.get('sort');

  if (typeof icon === "string") 
    icon = <Image src={icon} className="h-12 w-12 rounded-lg" />;

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="-ml-4 -mt-4 flex flex-wrap items-center justify-between sm:flex-nowrap">
        <div className="ml-4 mt-4">
          <div className="flex items-center">
            <Title title={title} subtitle={subtitle} icon={icon} />
          </div>
        </div>
        <div className="ml-4 flex flex-shrink-0">
          {actions.length > 0 && filterTitle && <Buttons actions={actions} group={group} />}
        </div>
      </div>
      <div className="-ml-4 mt-1 flex flex-wrap items-center justify-between sm:flex-nowrap">
        <div className="ml-4 mt-4">
          <div className="flex items-center">
            {tabs.length > 0 && <Tabs tabs={tabs} />}
            {additionalFilters && <AdditionalFilter {...additionalFilters} />}
          </div>
        </div>
        <div className="ml-4 mt-2 flex flex-shrink-0">
          {!filterTitle && actions.length > 0 && <Buttons actions={actions} group={group} />}
          {filterTitle && <Filter filter={filter} sort={sort} filterParam={filterParam} 
                            filterTitle={filterTitle} allowSort={allowSort} additionalFilters={additionalFilters} />}
        </div>
      </div>
    </div>
  );
}

