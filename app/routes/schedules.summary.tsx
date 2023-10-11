import { Outlet } from "@remix-run/react";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";

export const handle = {
  name: "summary",
  breadcrumb: ({ current, name }: BreadcrumbProps) => 
    <Breadcrumb to='/schedules/summary' name={name} current={current} />
};

export default () => null;
