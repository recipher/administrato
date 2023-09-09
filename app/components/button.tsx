import { MouseEventHandler } from 'react';
import { useTranslation } from 'react-i18next';
import classnames from '~/helpers/classnames';

export enum ButtonType {
  Secondary,
  Primary,
};

export type ButtonProps = {
  title: string;
  type?: ButtonType;
  icon?: any;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  permission?: string;
  disabled?: boolean;
};

export default ({ title, type = ButtonType.Primary, ...props }: ButtonProps) => {
  const { t } = useTranslation();

  const classNames = new Map([
    [ ButtonType.Primary, "bg-indigo-600 font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600" ],
    [ ButtonType.Secondary, "bg-white text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50" ],
  ]);

  return (
    <button
      type="button"
      onClick={props.onClick}
      className={classnames(classNames.get(type) || "", "ml-3 inline-flex items-center rounded-md px-3 py-2 text-sm shadow-sm")}
      >
      {props.icon && <props.icon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />}
      {t(title)}
    </button>
  );
};
