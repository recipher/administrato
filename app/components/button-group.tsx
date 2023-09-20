import { Fragment } from 'react';
import { Link, useNavigate, useSearchParams } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';

import Button, { ButtonType } from './button';
import classnames from '~/helpers/classnames';
import buildTo from '~/helpers/build-to';

export type ButtonGroupButton = {
  title: string,
  to?: string,
  icon?: any,
  onClick?: Function,
  default?: boolean | undefined,
};
export type ButtonGroupProps = {
  title?: string | undefined;
  buttons: Array<ButtonGroupButton>
};

const noOp = () => null!

export default function ButtonGroup({ title = '', buttons }: ButtonGroupProps) {
  const [ searchParams ] = useSearchParams();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const defaultButton = buttons.find(b => b.default === true) || buttons.at(0);

  if (!defaultButton) return;

  if (buttons.length === 1) return <Button {...defaultButton} type={ButtonType.Secondary} />

  const onClick = defaultButton.onClick || defaultButton.to ? () => navigate(buildTo(defaultButton.to, searchParams)) : noOp;

  return (
    <div className="inline-flex rounded-md shadow-sm">
      <button onClick={() => onClick()}
        type="button"
        className="relative inline-flex items-center rounded-l-md bg-white px-3 py-2 text-sm font-medium text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10 focus:outline-none"
      >
        {defaultButton.icon && <defaultButton.icon className="inline -ml-0.5 mr-2 h-4 w-4 text-gray-400" aria-hidden="true" />} 
        {t(title || defaultButton.title)}
      </button>
      <Menu as="div" className="relative -ml-px block">
        <Menu.Button className="relative inline-flex items-center rounded-r-md bg-white px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10 focus:outline-none">
          <span className="sr-only">Open options</span>
          <ChevronDownIcon className="h-5 w-5" aria-hidden="true" />
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
          <Menu.Items className="absolute right-0 z-50 -mr-1 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              {buttons.map((button) => (
                <Menu.Item key={button.title}>
                  {({ active }) => {
                    const className = classnames('block px-4 py-2 text-sm cursor-pointer',
                                        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700');
                    return button.onClick
                      ? <div className={className} onClick={() => button.onClick && button.onClick()}>
                          {/* {button.icon && <button.icon className="inline -ml-0.5 mr-2 h-4 w-4 text-gray-400" aria-hidden="true" />}  */}
                          {t(button.title)}
                        </div>
                      : <Link to={buildTo(button.to, searchParams)}
                          className={className}>
                          {/* {button.icon && <button.icon className="inline -ml-0.5 mr-2 h-4 w-4 text-gray-400" aria-hidden="true" />}  */}
                          {t(button.title)}
                        </Link>
                  }}
                </Menu.Item>
              ))}
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  );
}
