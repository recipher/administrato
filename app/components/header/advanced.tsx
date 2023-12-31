import { Fragment, ReactNode } from 'react';
import { Form, NavLink, useNavigate, useSearchParams } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid'

import Tabs, { TabsProps } from '../navigation-tabs';
import Actions, { ActionsProps } from '../actions';
import ButtonGroup from '../button-group';
import Image from '../image';
import { Separator } from '~/layout/breadcrumbs';

import Sort from './sort';
import classnames from '~/helpers/classnames';

export { TabType } from '../navigation-tabs';

export type TitleProps = {
  title: string;
  subtitle?:  string | undefined;
  icon?: ReactNode | string | undefined;
  navigation?: TabsProps;
};
export type FilterProps = {
  filterTitle?: string | undefined;
  filterParam?: string | undefined;
  allowSort?: boolean;
};
export type AdditionalFilterOptions = {
  name: string;
  value: string;
};
export type AdditionalFilterProps = {
  title: string;
  filters: Array<AdditionalFilterOptions>;
  filterParam: string;
  selected: string;
};
export type ButtonsProps = {
  actions?: ActionsProps;
  group?: boolean;
  title?: string | undefined;
};
export type Props = {
  additionalFilters?: AdditionalFilterProps;
  tabs?: TabsProps;
} & TitleProps & FilterProps & ButtonsProps;

export const Title = ({ title, subtitle, icon, navigation }: TitleProps) => {
  const { t } = useTranslation();

  const Text = () => 
    <h3 className={classnames(icon && !subtitle ? "pt-2": "", 
        "flex text-lg font-semibold leading-6 text-gray-900")}>
      {t(title)}
    </h3>

  const Navigation = () => (
    <ul className="flex items-center space-x-4" >
      {navigation?.map((item, index) => (
        <li key={item.name} className="flex items-center">
          <NavLink to={item.to}>
            {({ isActive }) => (
              <h3 className={classnames(isActive 
                ? "font-semibold text-gray-900" : "text-gray-600", "text-lg")}>
                <span className="flex items-center">
                  {index !== 0 && <Separator />}
                  {t(item.name)}
                </span>
              </h3>
            )}
          </NavLink>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      {icon && <div className="mr-4 mt-2 flex-shrink-0">{icon}</div>}
      <div className="h-8 group">
        {!navigation?.length ? <Text /> : <Navigation />}
        {subtitle && <p className="text-sm text-gray-500">
          {t(subtitle)}
        </p>} 
      </div>
    </>
  );
};

export const AdditionalFilter = ({ title, filters, filterParam, selected }: AdditionalFilterProps) => {
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
    <Menu as="div" className="mr-6 mb-2 relative inline-block text-left focus:outline-none">
      <div>
        <Menu.Button className="group inline-flex justify-center text-md text-gray-700 hover:text-gray-900 focus:outline-none">
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
        <Menu.Items className="absolute left-0 z-10 mt-1 w-40 origin-top-left rounded-md bg-white shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none">
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

export const Filter = ({ filterTitle, filterParam, allowSort, sort, filter, additionalFilters, className = "" }: 
  FilterProps & { sort: string | null, filter: string, additionalFilters?: AdditionalFilterProps | undefined, className?: string }) => {
  const { t } = useTranslation();
  return (
    <div className={classnames(className, "max-w-[34rem]")}>
      <label htmlFor="search" className="sr-only">
        {t('search')}
      </label>
      <div className="flex rounded-md shadow-sm my-3">
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
              <input type="hidden" name={additionalFilters.filterParam} value={additionalFilters.selected || ""} />}
          </Form>
        </div>
        {allowSort && <Sort sort={sort} />}
      </div>
    </div>
  );
};

export const Buttons = ({ actions = [], group = false, title }: ButtonsProps) => {
  return group
    ? <ButtonGroup buttons={actions} title={title} /> 
    : <Actions actions={actions} />
};

export default function Header({ title, navigation = [], subtitle, icon, tabs = [], actions = [], additionalFilters,
  filterTitle, filterParam = 'q', allowSort = true, group = false }: Props) {

  const [ searchParams ] = useSearchParams();
  const filter = searchParams.get(filterParam) || '';
  const sort = searchParams.get('sort');

  if (typeof icon === "string") 
    icon = <Image src={icon} className="h-12 w-12 rounded-full" />;

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className={classnames(icon ? "" : "mt-3", "flex flex-wrap items-center justify-between sm:flex-nowrap")}>
        <div className={classnames(icon ? "-ml-1" : "", "flex items-center")}>
          <Title title={title} subtitle={subtitle} icon={icon} navigation={navigation} />
        </div>
        <div className="-ml-3 sm:ml-4 flex flex-shrink-0 pt-3">
          {actions.length > 0 && <Buttons actions={actions} group={group} />}
        </div>
      </div>
      <div className="-ml-4 flex flex-auto items-center justify-between sm:flex-nowrap">
        <div className="ml-4 mt-4">
          <div className="flex flex-auto items-center">
            {tabs.length > 0 && <Tabs tabs={tabs} />}
            {additionalFilters && <AdditionalFilter {...additionalFilters} />}
          </div>
        </div>
        <div className="ml-4 mt-1 flex flex-shrink-0">
          {/* {!filterTitle && actions.length > 0 && <Buttons actions={actions} group={group} />} */}
          {filterTitle && <Filter filter={filter} sort={sort} filterParam={filterParam} 
                            filterTitle={filterTitle} allowSort={allowSort} additionalFilters={additionalFilters} />}
        </div>
      </div>
    </div>
  );
}

