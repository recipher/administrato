import type { LoaderArgs, V2_MetaFunction } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { EllipsisVerticalIcon, PlusIcon } from '@heroicons/react/20/solid';
import { listServiceCentres } from '~/models/service-centres.server';
import type { ServiceCentre } from '~/models/service-centres.server';
import Empty from '~/layout/empty';

const classNames = (...classes: string[]) => classes.filter(Boolean).join(' ');

export const loader = async ({ request }: LoaderArgs) => {
  const serviceCentres = await listServiceCentres();

  return { serviceCentres };
};

export default function Countries() {
  const { serviceCentres } = useLoaderData();

  return (
    <>
      <Empty data={serviceCentres} 
        entity='service centre' 
        message='Get started by adding a new service centre' />
      
      <ul role="list" className="divide-y divide-gray-100">
        {serviceCentres.map((serviceCentre: ServiceCentre) => (
          <li key={serviceCentre.id} className="flex justify-between gap-x-6 py-5">
            <div className="flex min-w-0 gap-x-4">
              <div className="min-w-0 flex-auto">
                <p className="text-sm font-semibold leading-6 text-gray-900">
                  <a href={'.'} className="hover:underline">
                    {serviceCentre.name}
                  </a>
                </p>
                <p className="mt-1 flex text-xs leading-5 text-gray-500">
                  <a href={`mailto:${serviceCentre.name}`} className="truncate hover:underline">
                    {serviceCentre.name}
                  </a>
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-x-6">
              <Menu as="div" className="relative flex-none">
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
                          className={classNames(
                            active ? 'bg-gray-50' : '',
                            'block px-3 py-1 text-sm leading-6 text-gray-900'
                          )}
                        >
                          View profile<span className="sr-only">, {serviceCentre.name}</span>
                        </a>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <a
                          href="#"
                          className={classNames(
                            active ? 'bg-gray-50' : '',
                            'block px-3 py-1 text-sm leading-6 text-gray-900'
                          )}
                        >
                          Message<span className="sr-only">, {serviceCentre.name}</span>
                        </a>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          </li>
        ))}
      </ul>

      <div className="pt-6 flex border-t border-gray-900/10  items-center justify-start gap-x-6">
        <Link to='add'>
          <button
            type="button"
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            New service centre
          </button>
        </Link>
      </div>
    </>
  )
}
