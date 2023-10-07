import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { type LoaderFunction, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { requireUser } from "~/auth/auth.server";
import { useTranslation } from "react-i18next";

import SearchService from "~/models/manage/search.server";

import Alert, { Level } from '~/components/alert';
import { List, ListContext, ListItem } from '~/components/list';
import Pagination, { NO_COUNT } from "~/components/pagination";

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";

import pluralize from "~/helpers/pluralize";
import toNumber from "~/helpers/to-number";

const LIMIT = 10;

export const handle = {
  name: "search",
  breadcrumb: ({ current, name }: BreadcrumbProps) => 
    <Breadcrumb Icon={MagnifyingGlassIcon} to='/search' name={name} current={current} />
};

type LoaderData = {
  search: string | null;
  offset: number | undefined;
  limit: number;
  results: Array<any>;
};

export const loader: LoaderFunction = async ({ params, request }) => {
  const u = await requireUser(request);
  const url = new URL(request.url);
  const offset = toNumber(url.searchParams.get("offset") as string);
  const limit = toNumber(url.searchParams.get("limit") as string) || LIMIT;
  const search = url.searchParams.get("q");
  const sort = url.searchParams.get("sort");

  const service = SearchService(u);
  const results = search ? await service.search({ search }, { offset, limit, sortDirection: sort }) : [];
  return json<LoaderData>({ search: search ? search : "(no search)", results, offset, limit });
};

export default function Search() {
  const { t } = useTranslation();
  const { search, results, offset, limit } = useLoaderData();

  const Item = (item: any) => <ListItem data={item.name} sub={t(item.type)} image={item.image} />;

  const Context = (item: any) => 
    <ListContext select={true} />

  return (
    <>
      <h2>
        <span>Search Results for{' '}</span>
        <span className="underline font-medium">{search}</span>
      </h2>

      {results.length <= 0 && <Alert title={`No search results found`} level={Level.Warning} />}
      <List data={results} renderItem={Item} renderContext={Context} buildTo={({ item }: any) => `/manage/${pluralize(t(item.type))}/${item.id}/info`} />
      <Pagination entity='result' totalItems={NO_COUNT} count={results.length} offset={offset} limit={limit} />
    </>
  );
};
