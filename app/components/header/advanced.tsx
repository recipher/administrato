import { ReactNode } from 'react';
import { Form, useSearchParams } from '@remix-run/react';
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import { useTranslation } from 'react-i18next';

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
type ButtonsProps = {
  actions?: ActionsProps;
  group?: boolean;
};
type Props = {
  tabs?: TabsProps,
} & TitleProps & FilterProps & ButtonsProps;

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

const Filter = ({ filterTitle, filterParam, allowSort, sort, filter }: FilterProps & { sort: string | null, filter: string }) => {
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
              defaultValue={filter}
            />
            <input type="submit" hidden />
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

export default function Header({ title, subtitle, icon, tabs = [], actions = [],
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
            <Tabs tabs={tabs} />
          </div>
        </div>
        <div className="ml-4 mt-2 flex flex-shrink-0">
          {!filterTitle && actions.length > 0 && <Buttons actions={actions} group={group} />}
          {filterTitle && <Filter filter={filter} sort={sort} filterParam={filterParam} filterTitle={filterTitle} allowSort={allowSort} />}
        </div>
      </div>
    </div>
  );
}

