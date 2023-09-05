import { Outlet } from "@remix-run/react";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";

import { Breadcrumb } from "~/layout/breadcrumbs";

export const handle = {
  breadcrumb: ({ current }: { current: boolean }) => 
    <Breadcrumb Icon={CalendarDaysIcon} to='/schedules' name="Schedules" current={current} />
};

export default function Schedules() {
  return (
    <div className="mt-5">
      <Outlet/>
    </div>
  );
}
