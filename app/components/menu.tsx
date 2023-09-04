import { Fragment } from "react";
import { Menu, Transition } from '@headlessui/react'
import { EllipsisVerticalIcon, PlusIcon } from '@heroicons/react/20/solid';

import classnames from "~/helpers/classnames";

type Props = {
  menus: Array<{
    text: string;
    onClick: Function;
  }>;
  className?: string
};

export default ({ menus, className = "" }: Props) => {
  return (
    <Menu as="div" className={classnames(className, "relative flex-none")}>
      <Menu.Button className="-m-2.5 block p-2.5 text-gray-500 hover:text-gray-900">
        <span className="sr-only">Open options</span>
        <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
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
        <Menu.Items className="absolute right-0 z-10 mt-2 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
          <Menu.Item>
            {({ active }) => (
              <a
                href="#"
                className={classnames(
                  active ? 'bg-gray-50' : '',
                  'block px-3 py-1 text-sm leading-6 text-gray-900'
                )}
              >
                View profile
              </a>
            )}
          </Menu.Item>
          <Menu.Item>
            {({ active }) => (
              <a
                href="#"
                className={classnames(
                  active ? 'bg-gray-50' : '',
                  'block px-3 py-1 text-sm leading-6 text-gray-900'
                )}
              >
                Message
              </a>
            )}
          </Menu.Item>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}