import { ReactNode } from 'react';
import { Link } from '@remix-run/react';

import classnames from '~/helpers/classnames';

type Props = {
  data?: Array<any>,
  idKey?: string;
  onClick?: Function;
  renderItem(item: any): ReactNode,
  renderContext(item: any): ReactNode,
};

export default function List({ data = [], idKey = "id", onClick, renderItem, renderContext }: Props) {
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
      {data.map((item: any) => (
        <li key={item[idKey]}>
          {onClick 
            ? <div className={classnames(item[idKey] ? "cursor-pointer" : "")} onClick={() => item[idKey] && onClick(item) }>
                <Item item={item} />
              </div>
            : <Link to={item[idKey]}><Item item={item} /></Link>}
        </li>
      ))}
    </ul>
  );
}
