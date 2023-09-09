import { Outlet } from "@remix-run/react";
import { UserCircleIcon } from "@heroicons/react/24/outline";

import { Breadcrumb } from "~/layout/breadcrumbs";
import withAuthorization from "~/auth/with-authorization";
import { security } from "~/auth/permissions";

export const handle = {
  breadcrumb: ({ current }: { current: boolean }) => 
    <Breadcrumb Icon={UserCircleIcon} to="/access/users" name="users" current={current} />
};

const Users = () => <Outlet />;

export default withAuthorization(security.read.user)(Users);
