import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import Tabs, { TabsProps } from '../navigation-tabs';
import Actions, { ActionsProps } from '../actions';
import ButtonGroup from '../button-group';
import Image from '../image';

type Props = {
  title: string;
  subtitle?: string;
  tabs?: TabsProps,
  actions?: ActionsProps,
  icon?: ReactNode | string;
  group?: boolean;
};

export default function Header({ title, subtitle, tabs = [], actions = [], icon, group = false }: Props) {
  const { t } = useTranslation();

  if (typeof icon === "string") 
    icon = <Image src={icon} className="h-12 w-12 rounded-lg" />;

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="-ml-4 -mt-4 flex flex-wrap items-center justify-between sm:flex-nowrap">
        <div className="ml-4 mt-4">
          <div className="flex items-center">
            {icon && <div className="mr-4 flex-shrink-0">{icon}</div>}
            <div>
              <h3 className="text-base font-semibold leading-6 text-gray-900">{t(title)}</h3>
              {subtitle && <p className="text-sm text-gray-500">
                {t(subtitle)}
              </p>}
            </div>
          </div>
        </div>
        <div className="ml-4 flex flex-shrink-0">
          {group
            ? <ButtonGroup buttons={actions} title='' /> 
            : <Actions actions={actions} />}
        </div>
      </div>
      <Tabs tabs={tabs} />
    </div>
  )
}
