import type { V2_MetaFunction } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import { IdentificationIcon } from "@heroicons/react/24/outline";

export const meta: V2_MetaFunction = () => [{ title: "Scheduler" }];

import { Breadcrumb } from "~/layout/breadcrumbs";

export const handle = {
  breadcrumb: ({ current }: { current: boolean }) => 
    <Breadcrumb Icon={IdentificationIcon} to='/manage/clients' name="Clients" current={current} />
};

export default function Index() {
  return (
    <div className="mt-5">
      <Outlet />
    </div>
  );
}
