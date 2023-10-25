import { Fragment } from 'react';
import { NavLink, useNavigate } from '@remix-run/react';
import { useTranslation } from 'react-i18next';
import { Menu, Transition } from "@headlessui/react";

import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";

import classnames from '~/helpers/classnames';

export enum TabType {
  Primary,
  Secondary
};

type TabProp = {
  name: string;
  to: string;
  disabled?: boolean;
  hidden?: boolean;
  type?: TabType;
  count?: string | number | undefined;
};
export type TabsProps = Array<TabProp>;
type Props = { tabs: TabsProps, max?: number };

const Dropdown = ({ tabs }: Props) => {
  const { t } = useTranslation();

  if (tabs.length === 0) return null;

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="-m-2 flex block py-2 text-gray-500 hover:text-gray-900 outline-none">
        <span className="whitespace-nowrap mr-3 pb-2 text-md font-medium border-transparent text-gray-500 hover:text-gray-700">More</span>
        <EllipsisVerticalIcon className="h-5 w-5 mt-0.5" aria-hidden="true" />
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 min-w-[10rem] origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
          {tabs.map(tab => {
            return (
              <Menu.Item key={tab.name}>
                {({ active }) => (
                  <NavLink to={tab.to}>
                    {({ isActive, isPending }) => (
                      <div aria-current={isActive ? 'page' : undefined}
                        className={classnames(isActive
                          ? 'text-indigo-600'
                          : 'text-gray-500 hover:text-gray-700',
                          active ? 'bg-gray-100' : '',
                        'block px-3 py-1 text-sm leading-6'
                      )}>
                        {t(tab.name)}
                        {tab.count ? (
                          <div
                            className={classnames(
                              isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-900',
                              'ml-3 hidden rounded-full px-2 text-md md:inline-block'
                            )}
                          >
                            {tab.count}
                          </div>) : null}
                      </div>
                  )}</NavLink>
                )}
              </Menu.Item>
            );
          })} 
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default function Tabs({ tabs, max = 6 }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  let primary = tabs.slice(0, max),
      secondary = tabs.slice(max, tabs.length);

  if (tabs.filter(t => t.type !== undefined).length > 0) {
    primary = tabs.filter(t => t.type === TabType.Primary || t.type === undefined);
    secondary = tabs.filter(t => t.type === TabType.Secondary);
  }

  return (
    <>
      <div className="mt-3">
        <div className="sm:hidden">
          <label htmlFor="current-tab" className="sr-only">
            Select a tab
          </label>
          <select
            id="current-tab"
            name="current-tab"
            className="block w-full rounded-md border-0 mb-3 py-1.5 pl-3 pr-10 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
            defaultValue={tabs.find((tab) => false)?.name}
            onChange={e => navigate(e.target.value)}
          >
            {tabs.map((tab) => <option key={tab.name} value={tab.to}>{t(tab.name)}</option>)}
          </select>
        </div>
        <div className="hidden flex justify-between sm:block">
          <nav className="-mb-px flex space-x-8">
            {primary.map((tab) => (
              <Fragment key={tab.name}>
                {tab.hidden ? null :
                  tab.disabled
                    ? <div className="whitespace-nowrap text-gray-400 pr-4 mr-4 pb-3 text-md font-medium">
                        {t(tab.name)}
                      </div>
                    : <NavLink to={tab.to}>
                        {({ isActive, isPending }) => (
                          <div aria-current={isActive ? 'page' : undefined}
                            className={classnames(isActive
                              ? 'border-indigo-500 text-indigo-600'
                              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                            'whitespace-nowrap border-b-2 mr-4 pb-3 text-md font-medium'
                          )}>
                            {t(tab.name)}
                            {tab.count ? (
                              <div
                                className={classnames(
                                  isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-900',
                                  'ml-3 hidden rounded-full px-2 text-md md:inline-block'
                                )}
                              >
                                {tab.count}
                              </div>) : null}
                            </div>
                      )}</NavLink>}
              </Fragment>
            ))}
            <Dropdown tabs={secondary} />
            {tabs.length === 0 && <div className="pb-3" />}
          </nav>
        </div>
      </div>
    </>
  );
};
