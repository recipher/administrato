import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import classnames from '~/helpers/classnames';

const MAX_MOBILE_TABS = 3;

type Props = {
  tabs: Array<{
    name: string;
    icon?: any;
    value?: string;
    count?: string;
    selectable?: boolean;
  }>;
  selected: string;
  onClick: Function;
};

const Tabs = ({ tabs, selected, onClick }: Props) => { 
  const { t } = useTranslation();
  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => (
          <div
            key={tab.name}
            onClick={() => onClick(tab.value === undefined ? tab.name : tab.value)}
            className={classnames(
              ((tab.value === undefined ? tab.name : tab.value) == selected) &&
                tab.selectable !== false
                ? 'border-indigo-500 text-indigo-600 hover:text-indigo-500 hover:border-indigo-400'
                : tab.selectable === false ? 'text-gray-500 hover:text-gray-700 border-transparent' : 'text-gray-500 hover:text-gray-700 border-transparent hover:border-gray-300',
              'flex whitespace-nowrap border-b-2 pt-4 pb-2 text-md hover:cursor-pointer'
            )}
            aria-current={tab.value === selected ? 'page' : undefined}
          >
            {tab.icon ? <tab.icon className="mt-1 h-4 w-4" /> : t(tab.name)}
            {tab.count ? (
              <div
                className={classnames(
                  tab.value || tab.name == selected ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-900',
                  'ml-3 hidden rounded-full px-2 text-md md:inline-block'
                )}
              >
                {tab.count}
              </div>
            ) : null}
          </div>
        ))}
      </nav>
    </div>
  );
};

export default ({ tabs, selected, onClick }: Props) => {
  const { t } = useTranslation();

  if (tabs === undefined || tabs.length === 0) return;

  return (
    <div>
      <div className="sm:hidden">
        {tabs.length > MAX_MOBILE_TABS
          ? <>
              <label htmlFor="tabs" className="sr-only">
                Select a tab
              </label>
              <select
                name="tabs"
                className="block w-full rounded-md border-gray-300 mb-4 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                defaultValue={selected}
                onChange={(e) => onClick(e.target.value)}
              >
                {tabs.map((tab) => <option key={tab.name}>{t(tab.value || tab.name)}</option>)}
              </select>
            </>
          : <Tabs tabs={tabs} selected={selected} onClick={onClick} />}
      </div>
      <div className="hidden sm:block">
        <Tabs tabs={tabs} selected={selected} onClick={onClick} />
      </div>
    </div>
  )
}
