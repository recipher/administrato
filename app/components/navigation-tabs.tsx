import { NavLink, useNavigate } from '@remix-run/react';
import { useTranslation } from 'react-i18next';
import classnames from '~/helpers/classnames';

const MAX_MOBILE_TABS = 3;

export type TabsProps = Array<{
  name: string;
  to: string;
  disabled?: boolean;
  hidden?: boolean;
}>;

type Props = {
  tabs: TabsProps,
};

export default function Tabs({ tabs }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

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
        <div className="hidden sm:block">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              tab.hidden ? null :
                tab.disabled
                  ? <div className="whitespace-nowrap text-gray-400 pr-4 mr-4 pb-3 text-md font-medium">
                      {t(tab.name)}
                    </div>
                  : <NavLink key={tab.name} to={tab.to}>
                      {({ isActive, isPending }) => (
                        <div aria-current={isActive ? 'page' : undefined}
                          className={classnames(isActive
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                          'whitespace-nowrap border-b-2 mr-4 pb-3 text-md font-medium'
                        )}>{t(tab.name)}</div>
                      )}
                    </NavLink>
            ))}
            {tabs.length === 0 && <div className="pb-3" />}
          </nav>
        </div>
      </div>
    </>
  );
}
