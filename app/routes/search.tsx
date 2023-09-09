import { MagnifyingGlassCircleIcon } from "@heroicons/react/24/outline";
import { LoaderFunction, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { Breadcrumb } from "~/layout/breadcrumbs";

export const handle = {
  breadcrumb: ({ current }: { current: boolean }) => 
    <Breadcrumb Icon={MagnifyingGlassCircleIcon} to='/search' name="Search" current={current} />
};

type LoaderData = {
  q: string | null;
  // entries: NonNullable<Awaited<ReturnType<typeof search>>>;
};

export const loader: LoaderFunction = async ({ params, request }) => {
  const url = new URL(request.url);
  const q = url.searchParams.get("q");

  // const entries = await search(q as string);

  return json<LoaderData>({ q });
};

export default function EntryPage() {
  const { q } = useLoaderData() as LoaderData;

  return (
    <h3>
      <span>Search Results for{' '}</span>
      <span className="underline">{q}</span>
    </h3>
  );
};
