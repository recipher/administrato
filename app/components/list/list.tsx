import { ReactNode } from 'react';
import { Link } from '@remix-run/react';

import classnames from '~/helpers/classnames';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

type ToProps = {
  item: any;
  idKey?: string;
};

type Props = {
  data?: Array<any>,
  idKey?: string;
  onClick?: Function;
  renderItem(item: any): ReactNode,
  renderContext(item: any): ReactNode,
  buildTo?(props: ToProps): string;
};

export const ListItem = ({ image, data, sub }: { data: any, sub?: any, image?: ReactNode }) => {
  return (
    <>
      {image}
      <div className="min-w-0 flex-auto">
        <p className="text-md font-semibold leading-6 text-gray-900">
          {data}
        </p>
        <p className="mt-1 flex text-sm leading-5 text-gray-500">
          {sub}
        </p>
      </div>
    </>
  );
};

export const ListContext = ({ data, sub, chevron = true }: { data?: any, sub?: any, chevron?: boolean }) => {
  return (
    <>
      <div className="hidden shrink-0 text-sm sm:flex sm:flex-col sm:items-end">
        <p className="text-sm leading-6 text-gray-900">
          {data}
        </p>
        <p className="mt-1 text-xs leading-5 text-gray-500">
          {sub}
        </p>
      </div>
      {chevron && <ChevronRightIcon className="h-5 w-5 flex-none text-gray-400" aria-hidden="true" />}
    </>
  );
};

const defaultTo = ({ item, idKey = "id" }: ToProps) => item[idKey];

export default function List({ data = [], idKey = "id", onClick, renderItem, renderContext, buildTo = defaultTo }: Props) {
  const Item = ({ item }: any) => (
    <div className="flex justify-between gap-x-6 py-3">
      <div className="flex min-w-0 gap-x-4">
        {renderItem(item)}
      </div>
      <div className="flex shrink-0 items-center gap-x-6">
        {renderContext(item)}
      </div>
    </div>
  );

  return (
    <ul role="list" className="divide-y divide-gray-100">
      {data.map((item: any, index: number) => (
        <li key={`${item[idKey]}-${index}`} className="group">
          {onClick 
            ? <div className={classnames(item[idKey] ? "cursor-pointer" : "")} onClick={() => item[idKey] && onClick(item) }>
                <Item item={item} />
              </div>
            : <Link to={buildTo({ item, idKey })}><Item item={item} /></Link>}
        </li>
      ))}
    </ul>
  );
}
