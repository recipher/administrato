import { MagnifyingGlassCircleIcon } from "@heroicons/react/24/outline";
import { type LoaderFunction, json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { requireUser } from "~/auth/auth.server";

import SearchService from "~/models/manage/search.server";

import Alert, { Level } from '~/components/alert';
import { List, ListContext, ListItem } from '~/components/list';

import { Breadcrumb } from "~/layout/breadcrumbs";
import pluralize from "~/helpers/pluralize";
import { useTranslation } from "react-i18next";

const LIMIT = 10;

export const handle = {
  breadcrumb: ({ current }: { current: boolean }) => 
    <Breadcrumb Icon={MagnifyingGlassCircleIcon} to='/search' name="search" current={current} />
};

type LoaderData = {
  q: string | null;
  results: Array<any>;
};

export const loader: LoaderFunction = async ({ params, request }) => {
  const u = await requireUser(request);
  const url = new URL(request.url);
  const q = url.searchParams.get("q");

  const service = SearchService(u);
  const results = await service.search({ search: q as string }, { offset: 0, limit: LIMIT, sortDirection: "asc" });

  return json<LoaderData>({ q, results });
};

export default function EntryPage() {
  const { t } = useTranslation();
  const { q, results } = useLoaderData() as LoaderData;

  const Item = (item: any) => <ListItem data={item.name} sub={t(item.type)} />;

  const Context = (item: any) => 
    <ListContext select={true} />

  return (
    <>
      <h2>
        <span>Search Results for{' '}</span>
        <span className="underline">{q}</span>
      </h2>

      {results.length <= 0 && <Alert title={`No results`} level={Level.Warning} />}
      <List data={results} renderItem={Item} renderContext={Context} buildTo={({ item }: any) => `/manage/${pluralize(t(item.type))}/${item.id}/info`} />
    </>
  );
};
