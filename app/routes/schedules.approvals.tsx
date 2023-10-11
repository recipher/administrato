import { Outlet } from "@remix-run/react";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";

export const handle = {
  name: "approvals",
  breadcrumb: ({ current, name }: BreadcrumbProps) => 
    <Breadcrumb to='/schedules/approvals' name={name} current={current} />
};

export default () => null;