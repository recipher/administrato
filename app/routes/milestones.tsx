import { Outlet } from "@remix-run/react";
import { Bars3BottomLeftIcon } from "@heroicons/react/24/outline";

import { Breadcrumb } from "~/layout/breadcrumbs";

export const handle = {
  breadcrumb: ({ current }: { current: boolean }) => 
    <Breadcrumb Icon={Bars3BottomLeftIcon} to='/milestones' name="milestones" current={current} />
};

export default () => <Outlet />;
