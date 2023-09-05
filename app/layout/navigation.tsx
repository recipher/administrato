import { Disclosure } from '@headlessui/react';
import { NavLink } from '@remix-run/react';
import { ChevronRightIcon } from '@heroicons/react/20/solid'
import {
  WalletIcon,
  PaperClipIcon,
  IdentificationIcon,
  GlobeEuropeAfricaIcon,
  KeyIcon,
  Bars3BottomLeftIcon,
  CircleStackIcon,
  ReceiptPercentIcon,
} from '@heroicons/react/24/outline';
import { CalendarDaysIcon } from '@heroicons/react/20/solid';

import classnames from '~/helpers/classnames';

const navigation = [
  { name: 'Schedules', to: '/schedules', icon: CalendarDaysIcon },
  { name: 'Holidays', to: '/holidays', icon: GlobeEuropeAfricaIcon },
  { name: 'Milestones', to: '/milestones', icon: Bars3BottomLeftIcon },
  { name: 'Manage', to: '/manage/legal-entities', icon: CircleStackIcon,
    children: [
      { name: 'Legal Entities', to: '/manage/legal-entities', icon: WalletIcon },
      { name: 'Service Centres', to: '/manage/service-centres', icon: PaperClipIcon },
      { name: 'Clients', to: '/manage/clients', icon: IdentificationIcon },
      { name: 'Providers', to: '/manage/providers', icon: ReceiptPercentIcon },
    ]
  },
  { name: 'Access', to: '/access', icon: KeyIcon },
];

export default function Navigation() {
  return (
    <nav className="flex flex-1 flex-col">
      <ul role="list" className="flex flex-1 flex-col gap-y-7">
        <li>
          <ul role="list" className="-mx-2 space-y-1">
            {navigation.map((item) => (
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
                    {item.name}
                  </NavLink>
                ) : (
                  <Disclosure as="div">
                    {({ open }) => (
                      <>
                        <Disclosure.Button
                          className='flex items-center w-full text-left rounded-md p-2 gap-x-3 text-sm leading-6 font-semibold text-gray-700 hover:bg-gray-50'
                        >
                          <item.icon className="h-6 w-6 shrink-0 text-gray-400" aria-hidden="true" />
                          {item.name}
                          <ChevronRightIcon
                            className={classnames(
                              open ? 'rotate-90 text-gray-500' : 'text-gray-400',
                              'ml-auto h-5 w-5 shrink-0'
                            )}
                            aria-hidden="true"
                          />
                        </Disclosure.Button>
                        <Disclosure.Panel as="ul" className="mt-1 px-2">
                          {item.children.map((subItem) => (
                            <li key={subItem.name}>
                              {/* 44px */}
                              <Disclosure.Button as="div">
                                <NavLink to={subItem.to} className={({ isActive, isPending }) => classnames(
                                  isActive ? 'bg-gray-100' : 'hover:bg-gray-50',
                                  'block rounded-md my-1 py-2 pr-2 pl-9 text-sm leading-6 text-gray-700'
                                )}>
                                  {subItem.name}
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
