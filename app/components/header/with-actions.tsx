import { ReactNode } from 'react';
import Tabs, { TabsProps } from '../navigation-tabs';
import Actions, { ActionsProps } from '../actions';
import ButtonGroup from '../button-group';

type Props = {
  title: string;
  subtitle?: string;
  tabs?: TabsProps,
  actions?: ActionsProps,
  icon?: ReactNode;
};

export default function Header({ title, subtitle, tabs = [], actions = [], icon }: Props) {
  return (
    <div className="relative border-b border-gray-200 pb-5 sm:pb-0">
      <>
        <div className="flex">
          {icon &&<div className="flex-shrink-0">{icon}</div>}
          <h3 className="text-base font-semibold leading-6 text-gray-900">{title}</h3>
          {subtitle && <p className="ml-2 mr-6 mt-1 truncate text-sm text-gray-500">{subtitle}</p>}
        </div>
        <div className="mt-3 flex md:absolute md:right-0 md:top-0 md:mt-0">
          <Actions actions={actions} />
        </div>
      </>
      <Tabs tabs={tabs} />
    </div>
  )
}
