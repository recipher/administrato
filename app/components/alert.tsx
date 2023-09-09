import { 
  ExclamationTriangleIcon, 
  XCircleIcon, 
  CheckCircleIcon,
  InformationCircleIcon } from '@heroicons/react/20/solid'

import classnames from '~/helpers/classnames';

export enum Level {
  Info,
  Success,
  Warning,
  Error,
};

type Props = {
  level?: Level;
  title: string;
  message?: string;
};

const colours = new Map<Level, string>([
  [ Level.Info, 'blue' ],
  [ Level.Error, 'red' ],
  [ Level.Success, 'green' ],
  [ Level.Warning, 'yellow' ],  
]);

const icons = new Map<Level, any>([
  [ Level.Info, InformationCircleIcon ],
  [ Level.Error, XCircleIcon ],
  [ Level.Success, CheckCircleIcon ],
  [ Level.Warning, ExclamationTriangleIcon ],  
]);

export default function Alert({ level = Level.Success, title, message }: Props) {
  const colour = colours.get(level);
  const Icon = icons.get(level);

  return (
    <div className={classnames(`bg-${colour}-50 border-${colour}-400`, "border-l-4 p-4 my-4")}>
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className={classnames(`text-${colour}-400`, "h-5 w-5")} aria-hidden="true" />
        </div>
        <div className="ml-3">
          <h3 className={classnames(`text-${colour}-800`, "text-sm font-medium")}>{title}</h3>
          {message && <div className={classnames(`text-${colour}-700`, "mt-2 text-sm")}>
            <p>{message}</p>
          </div>}
        </div>
      </div>
    </div>
  )
}
