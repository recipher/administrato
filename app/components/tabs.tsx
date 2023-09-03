import { NavLink } from '@remix-run/react';
import classnames from '~/helpers/classnames';

type Props = {
  tabs: Array<{
    name: string;
    to: string;
  }>,
};

export default function Tabs({ tabs }: Props) {
  return (
    <>
      <div className="mt-4">
        <div className="sm:hidden">
          <label htmlFor="current-tab" className="sr-only">
            Select a tab
          </label>
          <select
            id="current-tab"
            name="current-tab"
            className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
            defaultValue={tabs.find((tab) => false)?.name}
          >
            {tabs.map((tab) => (
              <option key={tab.name}>{tab.name}</option>
            ))}
          </select>
        </div>
        <div className="hidden sm:block">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <NavLink key={tab.name} to={tab.to}>
                {({ isActive, isPending }) => (
                  <div aria-current={isActive ? 'page' : undefined}
                    className={classnames(isActive
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                    'whitespace-nowrap border-b-2 mr-4 pb-4 text-sm font-medium'
                  )}>{tab.name}</div>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
}
