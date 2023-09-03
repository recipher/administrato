import { Outlet } from "@remix-run/react";
import { GlobeEuropeAfricaIcon } from "@heroicons/react/24/outline";
import Breadcrumbs from "~/layout/breadcrumbs";

const pages = [
  { name: 'Holidays', to: '/holidays', icon: GlobeEuropeAfricaIcon, current: false },
];

export default function Holidays() {
  return (
    <>
      <Breadcrumbs pages={pages} />
      <main className="mt-5">
        <Outlet/>
      </main>
    </>
  );
}
