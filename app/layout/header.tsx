import { FormEvent, Fragment, MouseEventHandler, RefObject, useRef } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Form, Link, useLocation, useSearchParams, useSubmit } from '@remix-run/react';
import {
  BellIcon, QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';
import { 
  ChevronDownIcon, 
  MagnifyingGlassIcon 
} from '@heroicons/react/20/solid';
import { useTranslation } from 'react-i18next';

import classnames from '~/helpers/classnames';
import { Organization, type User } from '~/auth/auth.server';
import Modal, { RefModal } from '~/components/modals/modal';
import { Basic as List } from '~/components/list';

type Props = { user: User };

const OrganizationModal = ({ modal, user, onSelect }: { modal: RefObject<RefModal>, onSelect: Function } & Props) => {
  const { t } = useTranslation();
  const organizations = user?.organizations || [];
  const data = [ { id: "", displayName: "No Organization", auth0id: null }, ...organizations ];

  return (
    <Modal ref={modal}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-md">{t('select-organization')}</h2>
        <List data={data} nameKey="displayName" onClick={onSelect} />
      </div>
    </Modal>
  );
};

export const Search = () => {
  const { t } = useTranslation();
  const [ searchParams ] = useSearchParams();

  const q = searchParams.get('q');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget;
    const elements = form.elements as typeof form.elements & {
      q: HTMLInputElement
    };
    const q = elements.q.value;

    if (q === "") e.preventDefault();
  };

  return (
    <Form className="relative flex flex-1" action="/search" method="GET" onSubmit={handleSubmit}>
      <label htmlFor="q" className="sr-only">
        {t('search')}
      </label>
      <MagnifyingGlassIcon
        className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400"
        aria-hidden="true"
      />
      <input
        id="q"
        className="block h-full w-full border-0 py-0 pl-8 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-md"
        placeholder={q || t('search')}
        type="search"
        autoCorrect="off"
        autoCapitalize="off"
        autoComplete="off"
        name="q"
      />
    </Form>
  );
}

export default function Header({ user, onClickHelp }: Props & { onClickHelp: MouseEventHandler<HTMLDivElement> }) {
  const { t } = useTranslation();
  const submit = useSubmit();
  const modal = useRef<RefModal>(null);

  const handleStopImpersonation = () => {
    if (user.impersonator === undefined) return;
    submit(
      { intent: "unimpersonate", user: user.impersonator }, 
      { action: `/access/users/${user.impersonator.id}`, method: "post", encType: "application/json" }
    );
  };

  const handleSelectOrganization = (organization: Organization) => {
    modal.current?.hide();
    submit(
      { intent: "select-organization", organization, user }, 
      { action: "/profile", method: "post", encType: "application/json" }
    );
  };
  
  const showOrganizationModal = () => modal.current?.show();

  const userNavigation = [
    { name: 'my-profile', to: '/profile' },
    { name: 'select-organization', onClick: showOrganizationModal },
    { name: 'unimpersonate', onClick: () => handleStopImpersonation(), hidden: user?.impersonator === undefined },
    { name: 'signout', to: '/logout' },
  ];

  return (
    <>
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <Search />

        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <Link to="/notifications" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500">
            <span className="sr-only">View Notifications</span>
            <BellIcon className="h-6 w-6" aria-hidden="true" />
          </Link>

          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />
        </div>

        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <div onClick={onClickHelp} className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500 cursor-pointer">
            <span className="sr-only">Open Help</span>
            <QuestionMarkCircleIcon className="h-6 w-6" aria-hidden="true" />
          </div>

          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />
        </div>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {user?.organization && <>
            <button type="button" onClick={showOrganizationModal}
              className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500">
              {user?.organization.displayName}
            </button>
            <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />
          </>}

          {/* Profile dropdown */}
          <Menu as="div" className="relative">
            <Menu.Button className="-m-1.5 flex items-center p-1.5 focus:outline-none">
              <span className="sr-only">Open user menu</span>
              <img
                className="h-8 w-8 rounded-full bg-gray-50"
                src={user?.picture}
                alt={user?.name}
              />
              <span className="hidden lg:flex lg:items-center">
                <span data-testid='username' className="ml-4 text-sm font-semibold leading-6 text-gray-900" aria-hidden="true">
                  {user?.name}
                </span>
                <ChevronDownIcon className="ml-2 h-5 w-5 text-gray-400" aria-hidden="true" />
              </span>
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
              <Menu.Items className="absolute right-0 z-[999] mt-2.5 min-w-max origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                {userNavigation.filter(({ hidden }) => !hidden).map((item) => (
                  <Menu.Item key={item.name}>
                    {({ active }) => (
                      item.onClick
                        ? <span className="block pl-3 pr-6 py-1 text-sm leading-6 text-gray-900 cursor-pointer"
                            onClick={item.onClick}>
                            {t(item.name)}
                          </span>
                        : <Link to={item.to} className={classnames(active ? 'bg-gray-50' : '',
                            'block pl-3 pr-6 py-1 text-sm leading-6 text-gray-900')}>
                            {t(item.name)}
                          </Link>
                    )}
                  </Menu.Item>
                ))}
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
      <OrganizationModal modal={modal} user={user} onSelect={handleSelectOrganization} />
    </>
  );
}
