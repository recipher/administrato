import { Outlet } from "@remix-run/react";
import { UsersIcon } from "@heroicons/react/24/outline";

import { Breadcrumb } from "~/layout/breadcrumbs";

export const handle = {
  breadcrumb: ({ current }: { current: boolean }) => 
    <Breadcrumb Icon={UsersIcon} to='/access/roles' name="Roles" current={current} />
};

export default () => <Outlet />;