import { Outlet } from "@remix-run/react";
import { PaperClipIcon } from "@heroicons/react/24/outline";
import Breadcrumbs from "~/layout/breadcrumbs";

const pages = [
  { name: 'Service Centres', to: '/manage/service-centres', icon: PaperClipIcon, current: false },
];

export default function ServiceCentres() {
  return (
    <>
      <Breadcrumbs pages={pages} />
      <main className="mt-5">
        <Outlet/>
      </main>
    </>
  )
}
