import { Outlet } from "@remix-run/react";
import { WalletIcon } from "@heroicons/react/24/outline";
import Breadcrumbs from "~/layout/breadcrumbs";

const pages = [
  { name: 'Legal Entities', to: '/manage/legal-entities', icon: WalletIcon, current: false },
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
