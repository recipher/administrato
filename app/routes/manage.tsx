import { V2_MetaFunction } from "@remix-run/node";
import { Outlet } from "@remix-run/react";

import { Breadcrumb } from "~/layout/breadcrumbs";

export const meta: V2_MetaFunction = () => {
  return [{ title: "Scheduler / Manage" }];
};

export const handle = {
  help: "manage",
  breadcrumb: ({ current }: { current: boolean }) => 
    <Breadcrumb to='/manage' name="manage" current={current} />
};

export default () => <Outlet />;
