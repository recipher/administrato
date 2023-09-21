import { useNavigate, useSearchParams } from '@remix-run/react';
import { useTranslation } from 'react-i18next';
import classnames from '~/helpers/classnames';
import buildTo from '~/helpers/build-to';

export enum ButtonType {
  Secondary,
  Primary,
};

export type ButtonProps = {
  title: string;
  type?: ButtonType;
  icon?: any;
  onClick?: Function;
  permission?: string;
  disabled?: boolean;
  submit?: boolean;
  to?: string;
};

export default ({ title, type = ButtonType.Primary, ...props }: ButtonProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [ searchParams ] = useSearchParams();

  const classNames = new Map([
    [ ButtonType.Primary, "bg-indigo-600 font-medium text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600" ],
    [ ButtonType.Secondary, "bg-white ring-1 ring-inset ring-gray-300 hover:bg-gray-50" ],
  ]);

  const disabledClassNames = new Map([
    [ ButtonType.Primary, "bg-indigo-300 hover:bg-indigo-300" ],
    [ ButtonType.Secondary, "bg-white text-gray-400 hover:bg-white" ],
  ]);

  const handleClick = (e: any) => {
    if (props.onClick) return props.onClick(e);
    if (props.to) return navigate(buildTo(searchParams, props.to));
  };

  return (
    <button
      type={props.submit === true ? "submit" : "button"}
      disabled={props.disabled}
      onClick={handleClick}
      className={classnames(classNames.get(type) || "", "inline-flex items-center rounded-md px-3 py-2 text-sm shadow-sm",
        props.disabled ?  disabledClassNames.get(type) || "" : "")}
      >
      {props.icon && 
        <props.icon className={classnames(type === ButtonType.Primary ? "text-white" : "", "-ml-0.5 mr-1.5 h-5 w-5",
          props.disabled ?  disabledClassNames.get(type) || "" : "")} aria-hidden="true" />}
      {t(title)}
    </button>
  );
};
