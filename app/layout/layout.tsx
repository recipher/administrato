import { useTranslation } from 'react-i18next';
import { useState, PropsWithChildren } from 'react';
import { Bars3Icon } from '@heroicons/react/24/outline';

import useBreadcrumbs from '~/hooks/use-breadcrumbs';

import Breadcrumbs from './breadcrumbs';
import Header from './header';
import Sidebar from './sidebar';
import Help from './help';

import { User } from '~/auth/auth.server';
import { Slideover } from '~/components/modals';
import { useHelp } from '~/hooks';

type Props = { user: User };

export default function Layout({ user, children }: PropsWithChildren<Props>) {
  const { t } = useTranslation();
  const helps = useHelp();
  const [ sidebarOpen, setSidebarOpen ] = useState(false)
  const [ helpOpen, setHelpOpen ] = useState(false)
  const [ activeHelp, setActiveHelp ] = useState((helps.find(help => {
    return help.current;
  }) || helps.at(helps.length-1))?.identifier || "app")
  const breadcrumbs = useBreadcrumbs();

  const handleClickHelp = () => setHelpOpen(true);

  return (
    <>
      <div>
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
        <Slideover open={helpOpen} onClose={() => setHelpOpen(false)} title="help">
          <Help helps={helps} active={activeHelp} onChangeHelp={setActiveHelp} />
        </Slideover>
        
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

              <Header user={user} onClickHelp={handleClickHelp} />
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
