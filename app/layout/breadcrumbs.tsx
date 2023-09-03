import { Link } from "@remix-run/react";

type Props = {
  pages: Array<{
    name: string;
    to: string;
    icon: any;
    current: boolean;
  }>;
};

export default function Breadcrumbs({ pages }: Props) {
  return (
    <nav className="flex" aria-label="breadcrumb">
      <ol role="list" className="flex items-center space-x-4">
        {pages.map((page, index) => (
          <li key={page.name}>
            <div className="flex items-center">
              {index !== 0 && <svg
                className="h-5 w-5 flex-shrink-0 text-gray-300"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
              </svg>}
              {page.icon && <page.icon className="h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" />}
              <Link
                to={page.to}
                className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700"
                aria-current={page.current ? 'page' : undefined}
              >
                {page.name}
              </Link>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}
