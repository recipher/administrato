import { useState, PropsWithChildren } from 'react';
import { Bars3Icon } from '@heroicons/react/24/outline';

import useBreadcrumbs from '~/hooks/use-breadcrumbs';

import Breadcrumbs from './breadcrumbs';
import Header from './header';
import Sidebar from './sidebar';

import { User } from '~/auth/auth.server';

type Props = { user: User };

export default function Layout({ user, children }: PropsWithChildren<Props>) {
  const [ sidebarOpen, setSidebarOpen ] = useState(false)

  const breadcrumbs = useBreadcrumbs();

  return (
    <>
      <div>
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

        <div className="lg:pl-72">
          <div className="sticky top-0 z-40 lg:mx-auto lg:max-w-7xl lg:px-8">
            <div className="flex h-16 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-0 lg:shadow-none">
              <button
                type="button"
                className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <span className="sr-only">Open sidebar</span>
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              </button>

              {/* Separator */}
              <div className="h-6 w-px bg-gray-200 lg:hidden" aria-hidden="true" />

              <Header user={user} />
            </div>
          </div>

          <main className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <Breadcrumbs breadcrumbs={breadcrumbs} />
              <div className="mt-6">{children}</div>
            </div>
          </main>
        </div>
      </div>
    </>
  )
}
