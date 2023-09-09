import type { V2_MetaFunction } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import { Bars3BottomLeftIcon } from "@heroicons/react/24/outline";

export const meta: V2_MetaFunction = () => [{ title: "Scheduler" }];

import { Breadcrumb } from "~/layout/breadcrumbs";

export const handle = {
  breadcrumb: ({ current }: { current: boolean }) => 
    <Breadcrumb Icon={Bars3BottomLeftIcon} to='/milestones' name="Milestones" current={current} />
};

export default () => <Outlet />;
