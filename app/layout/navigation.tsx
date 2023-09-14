import { Disclosure } from '@headlessui/react';
import { NavLink } from '@remix-run/react';
import { ChevronRightIcon } from '@heroicons/react/20/solid'
import {
  WalletIcon,
  MapIcon,
  IdentificationIcon,
  GlobeEuropeAfricaIcon,
  KeyIcon,
  Bars3BottomLeftIcon,
  CircleStackIcon,
  CurrencyYenIcon,
  UserCircleIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { CalendarDaysIcon } from '@heroicons/react/20/solid';

import { useTranslation } from 'react-i18next';
import { useOptionalUser } from '~/hooks';
import classnames from '~/helpers/classnames';

import { scheduler, security, manage } from '~/auth/permissions';

type NavItem = {
  name: string;
  to: string;
  icon?: any;
  permission?: string | undefined;
  children: Array<NavItem> | undefined;
};

export const navigation = [
  { name: 'schedules', to: '/schedules', icon: CalendarDaysIcon, permission: scheduler.read.schedule },
  { name: 'holidays', to: '/holidays', icon: GlobeEuropeAfricaIcon, permission: scheduler.read.holiday },
  { name: 'milestones', to: '/milestones', icon: Bars3BottomLeftIcon, permission: scheduler.read.milestone },
  { name: 'manage', to: '/manage/legal-entities', icon: CircleStackIcon,
    children: [
      { name: 'legal-entities', to: '/manage/legal-entities', icon: WalletIcon, permission: manage.read.legalEntity },
      { name: 'service-centres', to: '/manage/service-centres', icon: MapIcon, permission: manage.read.serviceCentre },
      { name: 'clients', to: '/manage/clients', icon: IdentificationIcon, permission: manage.read.client },
      { name: 'providers', to: '/manage/providers', icon: CurrencyYenIcon, permission: manage.read.provider },
    ]
  },
  { name: 'access', to: '/access', icon: KeyIcon,
    children: [
      { name: 'users', to: '/access/users', icon: UserCircleIcon, permission: security.read.user },
      { name: 'roles', to: '/access/roles', icon: UsersIcon, permission: security.read.role },
    ]
  },
];

export default function Navigation() {
  const { t } = useTranslation();
  const user = useOptionalUser();

  const filter = (items: Array<NavItem>) => {
    return items.filter(({ permission }: NavItem) => {
      if (permission === undefined) return true;
      return user?.permissions.includes(permission);
    });
  };
    
  return (
    <nav className="flex flex-1 flex-col">
      <ul role="list" className="flex flex-1 flex-col gap-y-7">
        <li>
          <ul role="list" className="-mx-2 space-y-1">
            {filter(navigation as Array<NavItem>).map((item) => (
              <li key={item.name}>
                {!item.children ? (
                  <NavLink
                    to={item.to}
                    className={({ isActive, isPending }) => classnames(
                      isActive ? 'bg-gray-100' : 'hover:bg-gray-50',
                      'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-700'
                    )}
                  >
                    <item.icon className="h-6 w-6 shrink-0 text-gray-400" aria-hidden="true" />
                    {t(item.name)}
                  </NavLink>
                ) : (
                  <Disclosure as="div">
                    {({ open }) => (
                      <>
                        {filter(item.children as Array<NavItem>).length > 0 && <Disclosure.Button
                          className='flex items-center w-full text-left rounded-md p-2 gap-x-3 text-sm leading-6 font-semibold text-gray-700 hover:bg-gray-50'
                        >
                          <item.icon className="h-6 w-6 shrink-0 text-gray-400" aria-hidden="true" />
                          {t(item.name)}
                          <ChevronRightIcon
                            className={classnames(
                              open ? 'rotate-90 text-gray-500' : 'text-gray-400',
                              'ml-auto h-5 w-5 shrink-0'
                            )}
                            aria-hidden="true"
                          />
                        </Disclosure.Button>}
                        <Disclosure.Panel as="ul" className="mt-1 px-2">
                          {filter(item.children as Array<NavItem>)?.map((subItem) => (
                            <li key={subItem.name}>
                              <Disclosure.Button as="div">
                                <NavLink to={subItem.to} className={({ isActive, isPending }) => classnames(
                                  isActive ? 'bg-gray-100' : 'hover:bg-gray-50',
                                  'block rounded-md my-1 py-2 pr-2 pl-9 text-sm leading-6 text-gray-700'
                                )}>
                                  {t(subItem.name)}
                                </NavLink>
                              </Disclosure.Button>
                            </li>
                          ))}
                        </Disclosure.Panel>
                      </>
                    )}
                  </Disclosure>
                )}
              </li>
            ))}
          </ul>
        </li>
      </ul>
    </nav>
  )
}
