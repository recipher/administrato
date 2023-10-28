import { Outlet } from "@remix-run/react";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";

export const handle = {
  name: "schedules",
  breadcrumb: (props: BreadcrumbProps) => 
    <Breadcrumb Icon={CalendarDaysIcon} to='/schedules/legal-entities' {...props} />
};

export default () => <Outlet/>;
