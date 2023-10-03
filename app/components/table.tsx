import { useTranslation } from "react-i18next";
import classnames from "~/helpers/classnames";

type Column = {
  name: string;
  label?: string;
  type?: string;
  display?: Function;
  className?: string;
  stack?: string;
};

type Action = {
  name?: string;
  to?: string;
  onClick?: Function;
  className: Function;
};

type Props = {
  data: Array<any>;
  columns: Array<Column>;
  actions: Array<Action>;
  showHeadings?: boolean;
  idKey?: string;
};
              
export default function Table({ data, columns, actions, showHeadings = false, idKey="id" }: Props) {
  const { t } = useTranslation();

  return (
    <div className="px-4">
      <div className="-mx-4 mt-3 sm:-mx-4">
        <table className={classnames(showHeadings ? "divide-y divide-gray-300" : "", "min-w-full")}>
          <thead>
            {showHeadings && <tr>
              {columns.map((column: Column, index) => (
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
            {data.map((item, ri) => (
              <tr key={item[idKey]} className="group">
                {columns.map((column: Column, ci) => (
                  <td key={ci} className={classnames(column.stack ? `hidden ${column.stack}:table-cell` : "", column.className || "", 
                                          "py-4 pr-3 text-sm font-medium text-gray-900")}>
                    {column.display ? column.display(item) : item[column.name]}
                    {ci === 0 && columns.filter(c => c.stack !== undefined).length > 0 && (
                      <dl className="font-normal lg:hidden">
                        {columns.filter(c => c.stack !== undefined).map(column => (
                          <dd className={classnames(`${column.stack}:hidden`, column.className || "", "mt-1 text-gray-800")}>
                            {column.display ? column.display(item) : item[column.name]}
                          </dd>
                        ))}
                      </dl>
                    )}
                  </td>
                ))}
                <td className="py-4 pl-3 text-right text-sm font-medium">
                  {actions.map((action: Action) => (
                    <button key={action.name} type="button" onClick={() => action.onClick && action.onClick(item)}
                      className={classnames(action.className ? action.className(item) : "", "group-hover:visible invisible pr-3")}>
                      {t(action.name || "")}
                    </button>                  
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
              
