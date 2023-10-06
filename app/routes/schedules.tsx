import { Outlet } from "@remix-run/react";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";

export const handle = {
  name: () => "schedules",
  breadcrumb: ({ current, name }: BreadcrumbProps) => 
    <Breadcrumb Icon={CalendarDaysIcon} to='/schedules' name={name} current={current} />
};

export default () => <Outlet/>;
