import { ReactNode } from 'react';
import { Link } from '@remix-run/react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

import Image from '~/components/image';  
import classnames from '~/helpers/classnames';

type ToProps = {
  item: any;
  idKey?: string;
};

type Props = {
  data?: Array<any>,
  idKey?: string;
  onClick?: Function;
  renderItem(item: any): ReactNode,
  buildTo?(props: ToProps): string;
  noNavigate?: boolean | undefined;
};

export const CardItem = ({ className = "text-md font-semibold", image, data, sub }: { className?: string, data: any, sub?: any, image?: ReactNode | string }) => {
  if (typeof image === "string") 
    image = image.length 
      ? <Image src={image} className="h-12 w-12 rounded-full" />
      : <div className="h-12 w-12 rounded-full border-solid border-2 border-gray-100" />;

  return (
    <>
      {image}
      <div className={classnames(className, "min-w-0 flex-auto")}>
        <p className="leading-6 text-gray-900 font-medium">
          {data}
        </p>
        <p className="mt-1 text-sm leading-5 font-normal text-gray-500">
          {sub}
        </p>
      </div>
    </>
  );
};

const defaultTo = ({ item, idKey = "id" }: ToProps) => item[idKey].toString();

export default function List({ data = [], idKey = "id", onClick, renderItem, buildTo = defaultTo, noNavigate = false }: Props) {
  const Item = ({ item }: any) => (
    <div className="flex justify-between gap-x-6 py-3">
      <div className="flex min-w-0 gap-x-4">
        {renderItem(item)}
      </div>
    </div>
  );

  return (
    <ul className="mt-3 grid grid-cols-2 gap-5 sm:grid-cols-4 sm:gap-6">
      {data.map((item: any, index: number) => (
        <li key={`${item[idKey]}-${index}`} className="group">
          {onClick 
            ? <div className={classnames(item[idKey] && noNavigate !== true ? "cursor-pointer" : "")} onClick={() => item[idKey] && onClick(item) }>
                <Item item={item} />
              </div>
            : noNavigate === true 
                ? <Item item={item} />
                : <Link to={buildTo({ item, idKey })}><Item item={item} /></Link>}
        </li>
      ))}
    </ul>
  );
};
