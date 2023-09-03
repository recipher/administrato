import Tabs from '../tabs';
import Actions from '../actions';
import Image from '../image';
import { ReactNode } from 'react';

type Props = {
  title: string;
  subtitle?: string;
  tabs?: Array<{
    name: string;
    to: string;
  }>,
  icon?: ReactNode;
};

export default function Header({ title, subtitle, tabs, icon }: Props) {
  return (
    <div className="relative border-b border-gray-200 pb-5 sm:pb-0">
      <>
        <div className="flex">
          {icon &&<div className="flex-shrink-0">{icon}</div>}
          <h3 className="text-base font-semibold leading-6 text-gray-900">{title}</h3>
          {subtitle && <p className="ml-2 mr-6 mt-1 truncate text-sm text-gray-500">{subtitle}</p>}
        </div>

        <Actions />
      </>

      {tabs && <Tabs tabs={tabs} />}
    </div>
  )
}
