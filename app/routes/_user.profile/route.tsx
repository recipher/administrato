import { Outlet } from "@remix-run/react";
import { UserCircleIcon } from "@heroicons/react/24/outline";

import { Breadcrumb } from "~/layout/breadcrumbs";

export const handle = {
  breadcrumb: ({ current }: { current: boolean }) => 
    <Breadcrumb Icon={UserCircleIcon} to='/profile' name="My Profile" current={current} />
};

export default () => <Outlet/>;
