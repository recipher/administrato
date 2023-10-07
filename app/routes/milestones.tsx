import { Outlet } from "@remix-run/react";
import { Bars3BottomLeftIcon } from "@heroicons/react/24/outline";

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";

export const handle = {
  name: "milestones",
  breadcrumb: ({ current, name }: BreadcrumbProps) => 
    <Breadcrumb Icon={Bars3BottomLeftIcon} to='/milestones' name={name} current={current} />
};

export default () => <Outlet />;
