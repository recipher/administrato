import { ReactNode } from 'react';
import { Link } from '@remix-run/react';

import Image from '../image';

type Props = {
  data?: Array<any>,
  idKey?: string;
  renderItem(item: any): ReactNode,
  renderContext(item: any): ReactNode,
};

export default function List({ data = [], idKey = "id", renderItem, renderContext }: Props) {
  return (
    <ul role="list" className="divide-y divide-gray-100">
      {data.map((item: any) => (
        <li key={item[idKey]}>
          <Link to={item[idKey]}>
            <div className="flex justify-between gap-x-6 py-3 hover:bg-gray-50">
              <div className="flex min-w-0 gap-x-4">
                {renderItem(item)}
              </div>
              <div className="flex shrink-0 items-center gap-x-6">
                {renderContext(item)}
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
