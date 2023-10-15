import { Fragment, useState } from "react";
import { Link, useNavigate } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { Menu, Transition } from "@headlessui/react";

import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { Button, ButtonType } from './';
import classnames from "~/helpers/classnames";

export type ColumnProps = {
  name: string;
  label?: string;
  type?: string;
  display?: Function;
  className?: string;
  headingClassName?: string;
  stack?: string;
};

type ActionProps = {
  name?: string;
  to?: string | Function;
  icon?: any;
  condition?: Function;
  onClick?: Function;
  className?: string | Function;
  row?: boolean;
  multiSelect?: boolean;
};

type Props = {
  data: Array<any>;
  columns: Array<ColumnProps>;
  actions?: Array<ActionProps>;
  showHeadings?: boolean;
  contextMenu?: boolean;
  idKey?: string;
  className?: string | undefined;
};

const buildTo = (action: ActionProps, item: any) =>
  typeof action.to === "function" ? action.to(item) : action.to;

const buildClassname = (action: ActionProps, item: any) =>
  action.className != null && typeof action.className === "function"
    ? action.className(item)
    : action.className;

const Action = ({ action, item }: { action: ActionProps, item: any }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  if (action.to) action.onClick = () => navigate(buildTo(action, item));

  const handleClick = (e: any) => {
    e.stopPropagation();
    action.onClick && action.onClick(item);
  };
  const className = buildClassname(action, item);

  return (
    <button type="button" onClick={handleClick}
      className={classnames(className ? className : "font-medium text-red-600 hover:text-red-500", 
        "group-hover:visible invisible pr-3")}>
      {t(action.name || "")}
    </button>                  
  );
};
        
const ContextMenu = ({ actions, item }: { actions: Array<ActionProps>, item: any }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  actions = actions?.filter(action => !action.row && action.condition ? action.condition(item) : true);
 
  if (actions.length === 0) return;

  return (
    <Menu as="div" className="relative flex-none">
      <Menu.Button className="-m-2.5 block py-2.5 text-gray-500 hover:text-gray-900 outline-none">
        <span className="sr-only">Open options</span>
        <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
          {actions.map(action => {
            if (action.to) action.onClick = () => navigate(buildTo(action, item));
            const className = buildClassname(action, item);
            return (
              <Menu.Item key={action.name} >
                <button type="button" onClick={() => action.onClick && action.onClick(item)}
                  className={classnames(className ? className : "font-medium text-red-600 hover:text-red-500", "block px-3 py-1 text-sm leading-6")}>
                  {t(action.name || "")}
                </button>  
              </Menu.Item>
            );
          })} 
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

const Actions = ({ actions = [], selected, idKey }: { actions: Array<ActionProps>, selected: Array<any>, idKey: string }) => {
  const navigate = useNavigate();
  
  const handleClick = (e: any, action: ActionProps) => {
    e.stopPropagation();
    if (action.to) {
      const to = typeof action.to === "function" ? action.to(selected.map(s => s[idKey])) : action.to;
      return navigate(to);
    }
    action.onClick && action.onClick(selected);
  };

  return (
    actions.map(action =>
      <span key={action.name} className="ml-3">
        <Button title={action.name as string} icon={action.icon}
          onClick={(e: any) => handleClick(e, action)}
          disabled={selected.filter(s => action.condition ? action.condition(s) : true).length === 0} type={ButtonType.Secondary} />
      </span>
    )
  );
}

const noOp = () => null!

const Checkbox = ({ name = "selected", item, selected, onSelect = noOp, onChange = noOp }: { name?: string, item?: { id: string }, selected?: boolean, onSelect?: Function, onChange?: Function }) => {
  const handleChange = (e: any) => {
    onSelect(item);
    onChange(e.currentTarget?.checked);
  };

  return (
    <div className="relative flex items-start">
      <div className="flex h-6 items-center">
        <input
          name={name}
          type="checkbox"
          checked={selected}
          onChange={handleChange}
          className="opacity-80 border-gray-300 text-indigo-600 h-4 w-4 rounded focus:ring-indigo-600"
        />
      </div>
    </div>
  );
};

export default function Table({ data, columns, actions, showHeadings = false, contextMenu = false, idKey="id", className }: Props) {
  const { t } = useTranslation();

  const [ selected, setSelected ] = useState<Array<any>>([]);

  const rowAction = actions?.find(action => action.row === true);
  const hasMultiSelect = !!(actions?.filter((action: ActionProps) => action.multiSelect));

  const handleSelect = (item: any) => {
    setSelected(() => selected.map(s => s[idKey]).includes(item[idKey])
      ? selected.filter(s => s[idKey] !== item[idKey]) : [ ...selected, item ]);
  };

  const handleSelectAll = (checked: boolean) => {
    setSelected(checked === true ? data : []);
  };

  return (
    <>
      {actions && data.length > 0 && <div className="-ml-3 mt-4">
        <Actions actions={actions.filter(action => action.multiSelect)} selected={selected} idKey={idKey} />
      </div>}

      <div className="px-4">
        <div className="-mx-4 mt-3 sm:-mx-4">
          <table className={classnames(showHeadings ? "divide-y divide-gray-300" : "", "min-w-full")}>
            <thead>
              {showHeadings && data.length > 0 && <tr>
                {hasMultiSelect && <th scope="col" className="w-8 px-3"><Checkbox onChange={handleSelectAll} /></th>}
                {columns.map((column: ColumnProps, index) => (
                  <th key={index} scope="col" className={classnames(column.headingClassName || "", column.stack ? `hidden ${column.stack}:table-cell` : "", "py-3.5 pr-3 text-left text-sm font-medium text-gray-900")}>
                    { typeof (column.label || column.name) === 'string' 
                        ? t(column.label || column.name)
                        : column.label || column.name}
                  </th>
                ))}
                <th scope="col" className="relative py-3.5 pl-3 pr-0">
                  <span className="sr-only">Action</span>
                </th>
              </tr>}
            </thead>
            <tbody className={classnames(className || "divide-y divide-gray-200 bg-white")}>
              {data.map((item) => (
                <tr key={item[idKey]} onClick={() => rowAction?.onClick && rowAction?.onClick(item)}
                  className={classnames(rowAction ? "cursor-pointer" : "", 
                    selected.map(s => s[idKey]).includes(item[idKey]) ? "bg-gray-50" : "",
                    "group text-sm font-normal text-gray-900")}>
                  {hasMultiSelect && 
                    <td className="px-3">
                      <Checkbox item={item} selected={selected.map(s => s[idKey]).includes(item[idKey])} onSelect={handleSelect} />
                    </td>}
                  {columns.map((column: ColumnProps, ci) => (
                    <td key={ci} className={classnames(column.stack ? `hidden ${column.stack}:table-cell` : "",  
                                            "py-4 pr-3", column.className || "")}>
                      {column.display ? column.display(item, column) : item[column.name]}
                      {ci === 0 && columns.filter(c => c.stack !== undefined).length > 0 && (
                        <dl className="font-normal lg:hidden">
                          {columns.filter(c => c.stack !== undefined).map(column => (
                            <dd key={column.name} 
                              className={classnames(`${column.stack}:hidden`, column.className || "", "mt-1 text-gray-800")}>
                              {column.display ? column.display(item, column) : item[column.name]}
                            </dd>
                          ))}
                        </dl>
                      )}
                    </td>
                  ))}
                  {actions?.filter(action => !action.row && action.condition ? action.condition(item) : true) 
                    ? <>
                        <td className={classnames(contextMenu ? "" : "sm:hidden", "py-4 px-3 text-right text-sm table-cell")}>
                          <ContextMenu actions={actions} item={item} />
                        </td>
                        <td className={classnames(contextMenu ? "" : "sm:table-cell", "py-4 px-3 text-right text-sm hidden")}>
                          {actions.filter(action => !action.row)
                            .map((action: ActionProps) => 
                              <Action key={action.name} action={action} item={item} />)}
                        </td>
                      </>
                    : <td>{' '}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};
              
