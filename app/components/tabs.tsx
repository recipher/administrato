import classnames from '~/helpers/classnames';

const MAX_MOBILE_TABS = 3;

type Props = {
  tabs: Array<{
    name: string;
    value?: string;
    count?: string;
  }>;
  selected: string;
  onClick: Function;
};

const Tabs = ({ tabs, selected, onClick }: Props) => (
  <div className="border-b border-gray-200">
    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
      {tabs.map((tab) => (
        <div
          key={tab.name}
          onClick={() => onClick(tab.name || tab.value)}
          className={classnames(
            tab.value || tab.name == selected
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
            'flex whitespace-nowrap border-b-2 pt-4 pb-2 text-md hover:cursor-pointer'
          )}
          aria-current={tab.value === selected ? 'page' : undefined}
        >
          {tab.name}
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

export default ({ tabs, selected, onClick }: Props) => {
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
                className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                defaultValue={selected}
                onChange={(e) => onClick(e.target.value)}
              >
                {tabs.map((tab) => <option key={tab.name}>{tab.value || tab.name}</option>)}
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
