import { Link } from '@remix-run/react';

import { ChevronRightIcon } from '@heroicons/react/24/outline'

type Props = {
  data?: Array<any>,
  idKey?: string;
  nameKey?: string;
  onClick: Function;
};

const Item = ({ title, subtitle }: { title: string, subtitle: string }) => (
  <>
    <div className="flex min-w-0 gap-x-4">
      <div className="min-w-0 flex-auto">
        <p className="text-md font-semibold leading-6 text-gray-900">
          {title}
        </p>
        <p className="mt-1 flex text-xs leading-5 text-gray-500">
          {subtitle}
        </p>
      </div>
    </div>
    <div className="flex shrink-0 items-center gap-x-6">
      <div className="hidden sm:flex sm:flex-col sm:items-end">
      </div>
      <ChevronRightIcon className="h-5 w-5 flex-none text-gray-400" aria-hidden="true" />
    </div>
  </>
);

export default function List({ data = [], idKey = "id", nameKey = "name", onClick }: Props) {

  return (
    <ul role="list" className="divide-y divide-gray-100">
      {data.map((item: any) => (
        <li key={item[idKey]}>
          {onClick
            ? <span className="flex justify-between gap-x-6 py-3 cursor-pointer"
                onClick={() => onClick(item[idKey])}>
                <Item title={item[nameKey]} subtitle={item[idKey]} />
              </span>
            : <Link to={`../../${item[idKey]}`} className="flex justify-between gap-x-6 py-3">
                <Item title={item[nameKey]} subtitle={item[idKey]} />
              </Link>}
        </li>
      ))}
    </ul>
  );
}
