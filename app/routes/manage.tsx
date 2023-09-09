import type { V2_MetaFunction } from "@remix-run/node";
import { Outlet } from "@remix-run/react";

export const meta: V2_MetaFunction = () => [{ title: "Scheduler" }];

import { Breadcrumb } from "~/layout/breadcrumbs";

export const handle = {
  breadcrumb: ({ current }: { current: boolean }) => 
    <Breadcrumb to='/manage' name="manage" current={current} />
};

export default () => <Outlet />;
