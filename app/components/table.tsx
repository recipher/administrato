import { Menu, Transition } from "@headlessui/react";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "@remix-run/react";
import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import classnames from "~/helpers/classnames";

type ColumnProps = {
  name: string;
  label?: string;
  type?: string;
  display?: Function;
  className?: string;
  stack?: string;
};

type ActionProps = {
  name?: string;
  to?: string;
  onClick?: Function;
  className: Function;
};

type Props = {
  data: Array<any>;
  columns: Array<ColumnProps>;
  actions: Array<ActionProps>;
  showHeadings?: boolean;
  idKey?: string;
};

const Action = ({ action, item }: { action: ActionProps, item: any }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  if (action.to) action.onClick = () => navigate(action.to as string);

  return (
    <button type="button" onClick={() => action.onClick && action.onClick(item)}
      className={classnames(action.className ? action.className(item) : "", "group-hover:visible invisible pr-3")}>
      {t(action.name || "")}
    </button>                  
  );
};
        
const ContextMenu = ({ actions, item }: { actions: Array<ActionProps>, item: any }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
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
            if (action.to) action.onClick = () => navigate(action.to as string);
            return (
              <Menu.Item key={action.name} >
                <button type="button" onClick={() => action.onClick && action.onClick(item)}
                  className={classnames(action.className ? action.className(item) : "", "block px-3 py-1 text-sm leading-6")}>
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

export default function Table({ data, columns, actions, showHeadings = false, idKey="id" }: Props) {
  const { t } = useTranslation();

  return (
    <div className="px-4">
      <div className="-mx-4 mt-3 sm:-mx-4">
        <table className={classnames(showHeadings ? "divide-y divide-gray-300" : "", "min-w-full")}>
          <thead>
            {showHeadings && <tr>
              {columns.map((column: ColumnProps, index) => (
                <th key={index} scope="col" className={classnames(column.stack ? `hidden ${column.stack}:table-cell` : "", "py-3.5 pr-3 text-left text-sm font-medium text-gray-900")}>
                  {t(column.name)}
                </th>
              ))}
              <th scope="col" className="relative py-3.5 pl-3 pr-0">
                <span className="sr-only">Edit</span>
              </th>
            </tr>}
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {data.map((item) => (
              <tr key={item[idKey]} className="group">
                {columns.map((column: ColumnProps, ci) => (
                  <td key={ci} className={classnames(column.stack ? `hidden ${column.stack}:table-cell` : "", column.className || "", 
                                          "py-4 pr-3 text-sm font-medium text-gray-900")}>
                    {column.display ? column.display(item) : item[column.name]}
                    {ci === 0 && columns.filter(c => c.stack !== undefined).length > 0 && (
                      <dl className="font-normal lg:hidden">
                        {columns.filter(c => c.stack !== undefined).map(column => (
                          <dd key={column.name} 
                            className={classnames(`${column.stack}:hidden`, column.className || "", "mt-1 text-gray-800")}>
                            {column.display ? column.display(item) : item[column.name]}
                          </dd>
                        ))}
                      </dl>
                    )}
                  </td>
                ))}
                <td className="py-4 pl-3 text-right text-sm table-cell sm:hidden">
                  <ContextMenu actions={actions} item={item} />
                </td>
                <td className="py-4 pl-3 text-right text-sm hidden sm:table-cell">
                  {actions.map((action: ActionProps) => <Action key={action.name} action={action} item={item} />)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
              