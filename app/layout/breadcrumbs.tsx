import { ReactNode } from "react";
import { Link } from "@remix-run/react";
import classnames from '~/helpers/classnames';

type PageProps = {
  name: string;
  to: string;
  current?: boolean;
  Icon?: any;
};

type Props = {
  breadcrumbs: Array<ReactNode>;
};

export const Breadcrumb = ({ name, to, Icon, current = false }: PageProps) => (
  <>
    {Icon && <Icon className="h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" />}
    <Link
      to={to}
      className={classnames(Icon ? "ml-4" : "", current ? "text-indigo-500 hover:text-indigo-700" : "text-gray-500 hover:text-gray-700",
        "text-md font-medium")}
      aria-current={current ? 'page' : undefined}
    >
      {name}
    </Link>
  </>
);

export const Separator = () => (
  <svg
    className="h-5 w-5 flex-shrink-0 text-gray-300 mr-3"
    fill="currentColor"
    viewBox="0 0 20 20"
    aria-hidden="true"
  >
    <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
  </svg>
);

export default function Breadcrumbs({ breadcrumbs }: Props) {
  if (breadcrumbs === undefined || breadcrumbs.length === 0) return;

  return (
    <nav className="flex" aria-label="breadcrumb">
      <ol role="list" className="flex items-center space-x-4">
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={index}>
            <div className="flex items-center">
              {index !== 0 && <Separator />}
              {breadcrumb}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}
