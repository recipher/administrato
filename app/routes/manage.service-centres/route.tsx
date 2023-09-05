import { Outlet } from "@remix-run/react";
import { PaperClipIcon } from "@heroicons/react/24/outline";
import Breadcrumbs from "~/layout/breadcrumbs";

const pages = [
  { name: 'Service Centres', to: '/manage/service-centres', icon: PaperClipIcon, current: false },
];

import { Breadcrumb } from "~/layout/breadcrumbs";

export const handle = {
  breadcrumb: ({ current }: { current: boolean }) => 
    <Breadcrumb Icon={PaperClipIcon} to='/manage/service-centres' name="Service Centres" current={current} />
};

export default function ServiceCentres() {
  return (
    <>
      <div className="mt-5">
        <Outlet/>
      </div>
    </>
  )
}
