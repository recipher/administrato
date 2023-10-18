import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { ActionsProps } from '../actions';
import Image from '../image';

import { Buttons, Title } from './advanced';
import classnames from '~/helpers/classnames';

type Props = {
  title: string;
  subtitle?: string;
  actions?: ActionsProps,
  icon?: ReactNode | string;
  group?: boolean;
};

export default function Header({ title, subtitle, actions = [], icon, group = false }: Props) {
  const { t } = useTranslation();

  if (typeof icon === "string") 
    icon = <Image src={icon} className="h-12 w-12 rounded-lg" />;

  return (
    <div className={classnames(icon ? "" : "mt-3", "border-b border-gray-200 bg-white")}>
      <div className={classnames(icon ? "-ml-1" : "", "flex flex-wrap items-center justify-between sm:flex-nowrap")}>
        <div className="mb-4 flex items-center">
          <Title title={title} subtitle={subtitle} icon={icon} />
        </div>
        <div className="ml-4 mb-4 flex flex-shrink-0">
          <Buttons actions={actions} group={group} />
        </div>
      </div>
    </div>
  )
}
