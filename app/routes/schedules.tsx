import { Outlet } from "@remix-run/react";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";

import { Breadcrumb } from "~/layout/breadcrumbs";

export const handle = {
  breadcrumb: ({ current }: { current: boolean }) => 
    <Breadcrumb Icon={CalendarDaysIcon} to='/schedules' name="schedules" current={current} />
};

export default () => <Outlet/>;
