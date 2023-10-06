import { ReactNode } from "react";
import { Link, useLocation } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { StarIcon } from "@heroicons/react/24/outline";
import { StarIcon as SelectedStarIcon } from "@heroicons/react/24/solid";
import classnames from '~/helpers/classnames';

type PageProps = {
  name: string;
  to: string;
  current?: boolean;
  Icon?: any;
};

type Favourite = { pathname: string; name: string };
type FavouriteProps = {
  favourites: Array<Favourite>;
  onFavourite: Function;
};

type Props = {
  breadcrumbs: Array<ReactNode>;
  page: Array<string>;
} & FavouriteProps;

export type BreadcrumbProps = {
  current: boolean; 
  name: string;
};

export const Breadcrumb = ({ name, to, Icon, current = false }: PageProps) => {
  const { t } = useTranslation();

  return (
    <>
      {Icon && <Icon className="h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" />}
      <Link
        to={to}
        className={classnames(Icon ? "ml-4" : "", current ? "text-indigo-500 hover:text-indigo-700" : "text-gray-500 hover:text-gray-700",
          "text-md font-medium whitespace-nowrap")}
        aria-current={current ? 'page' : undefined}
      >
        {t(name)}
      </Link>
    </>
  );
}

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

const Favourite = ({ favourites, pathname, onFavourite }: FavouriteProps & { pathname: string }) => {
  const favourited = favourites?.map((f: Favourite) => f.pathname).includes(pathname);
  return (
    favourited 
      ? <SelectedStarIcon onClick={() => onFavourite()} 
          className="h-5 w-5 ml-3 cursor-pointer flex-shrink-0 text-yellow-300 hover:text-yellow-200"/>
      : <StarIcon onClick={() => onFavourite()}
          className="h-5 w-5 ml-3 cursor-pointer flex-shrink-0 text-gray-300 hover:text-gray-400" />
  );
};

export default function Breadcrumbs({ breadcrumbs, page, favourites, onFavourite }: Props) {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  if (breadcrumbs === undefined || breadcrumbs.length === 0) return;

  const handleFavourite = () => {
    onFavourite(pathname, page.map((p: string) => t(p)).join(' | '));
  };

  return (
    <nav className="flex" aria-label="breadcrumb">
      <ol role="list" className="flex items-center space-x-4">
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={index}>
            <span className="flex items-center">
              {index !== 0 && <Separator />}
              {breadcrumb}
            </span>
          </li>
        ))}
        <Favourite favourites={favourites} pathname={pathname} onFavourite={handleFavourite} />
      </ol>
    </nav>
  );
}
