import { ReactNode, useRef, Fragment } from 'react';
import { Link } from '@remix-run/react';
import { useTranslation } from 'react-i18next';
import { useUser } from '~/hooks';

import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
 
import Image from '~/components/image';  
import ConfirmModal, { RefConfirmModal } from '../modals/confirm';

import { type EventFor, classnames } from '~/helpers';

type ToProps = {
  item: any;
  idKey?: string;
};

type ActionProps = {
  name: string;
  to?: Function | string | Function;
  href?: Function | string | undefined;
  download?: Function | string | undefined;
  condition?: Function;
  permission?: string;
  onClick?: Function;
  className?: string | Function;
  confirm?: string | Function;
};

type Props = {
  data?: Array<any>,
  idKey?: string;
  onClick?: Function;
  renderItem(item: any): ReactNode,
  renderContext?(item: any): ReactNode,
  buildTo?(props: ToProps): string;
  noNavigate?: boolean | undefined;
  download?: Function | undefined;
  actions?: Array<ActionProps>;
};

export const ListItem = ({ className = "text-md font-semibold", image, data, sub }: { className?: string, data: any, sub?: any, image?: ReactNode | string }) => {
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

export const ListContext = ({ data, sub, select = true, open = false }: { data?: any, sub?: any, select?: boolean, open?: boolean }) => {
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
      {select && !open && <ChevronRightIcon className="h-5 w-5 flex-none text-gray-400" aria-hidden="true" />}
      {open && <ChevronDownIcon className="h-5 w-5 flex-none text-gray-400" aria-hidden="true" />}
    </>
  );
};

const Actions = ({ actions, item, idKey = "id" }: { actions: Array<ActionProps>, item: any, idKey: string }) => {
  const { t } = useTranslation();
  const u = useUser();
  const confirm = useRef<RefConfirmModal>(null);
  
  const hasPermission = (permission: string | undefined) => 
    permission === undefined || u.permissions.includes(permission);

  const handleAnchorClick = (e: EventFor<"a", "onClick">, action: ActionProps) => {
    e.stopPropagation();
    if (action.onClick) action.onClick(item);
  };

  const handleButtonClick = (e: EventFor<"button", "onClick">, action: ActionProps) => {
    e.stopPropagation();
    e.preventDefault();
    if (action.confirm) {
      const message = typeof action.confirm === "function" ? action.confirm(item) : action.confirm;
      confirm.current?.show(`${message}?`, `Yes, ${t(action.name)}`, "Cancel", `Are you sure you want to ${message.toLowerCase()}?`);
    } else onConfirm(action);
  };

  const onConfirm = (action: ActionProps) => {
    if (action.onClick) action.onClick(item);
  };

  const className = (action: any) => classnames(action.className 
    ? typeof action.className === "function" ? action.className(item) : action.className 
    : "font-medium text-red-600 hover:text-red-500", "hidden group-hover:block float-right pl-3")

  return (
    <>
      <ul className="group-hover:block hidden">
        {actions
          .filter(action => hasPermission(action.permission) && 
                 (action.condition === undefined || action.condition(item)))
          .map((action: ActionProps) => (
          <Fragment key={action.name}>

            {action.onClick && !action.href
              ? <button onClick={(e) => handleButtonClick(e, action)} type="button" 
                  className={className(action)}>
                  {t(action.name)}
                </button>
              : action.download !== undefined || action.href !== undefined
                ? <a href={typeof action.href === 'function' ? action.href(item) : action.href} 
                     download={typeof action.download === 'function' ? action.download(item) : action.download} 
                     className={className(action)}
                     onClick={(e) => handleAnchorClick(e, action)}>
                    {t(action.name)}
                   </a>
                : <Link to={typeof action.to === 'function' ? action.to(item) : action.to}  
                        className={className(action)}>{t(action.name)}</Link>}
            <ConfirmModal ref={confirm} onYes={() => onConfirm(action)} />
          </Fragment>
        ))}
      </ul>
    </>
  );
};

const defaultTo = ({ item, idKey = "id" }: ToProps) => item[idKey].toString();

export default function List({ data = [], idKey = "id", onClick, renderItem, renderContext, buildTo = defaultTo, noNavigate = false, download, actions }: Props) {
  const Item = ({ item }: any) => (
    <div className="flex justify-between gap-x-6 py-3">
      <div className="flex min-w-0 gap-x-4">
        {renderItem(item)}
      </div>
      <div className="flex shrink-0 items-center gap-x-6">        
        {actions ? <Actions actions={actions} item={item} idKey={idKey} /> : renderContext ? renderContext(item) : null}
      </div>
    </div>
  );

  return (
    <ul className="divide-y divide-gray-100 py-3">
      {data.map((item: any, index: number) => (
        <li key={`${item[idKey]}-${index}`} className="group">
          {onClick 
            ? <div className={classnames(item[idKey] && noNavigate !== true ? "cursor-pointer" : "")} onClick={() => item[idKey] && onClick(item) }>
                <Item item={item} />
              </div>
            : noNavigate === true 
                ? <Item item={item} />
                : download !== undefined
                  ? <a href={buildTo({ item, idKey })} download={download(item)}>
                      <Item item={item} />
                    </a>
                  : <Link to={buildTo({ item, idKey })}><Item item={item} /></Link>}
        </li>
      ))}
    </ul>
  );
};
