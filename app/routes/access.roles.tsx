import { Outlet } from "@remix-run/react";
import { UsersIcon } from "@heroicons/react/24/outline";

import { Breadcrumb } from "~/layout/breadcrumbs";
import withAuthorization from "~/auth/with-authorization";
import { security } from "~/auth/permissions";

export const handle = {
  breadcrumb: ({ current }: { current: boolean }) => 
    <Breadcrumb Icon={UsersIcon} to="/access/roles" name="roles" current={current} />
};

const Roles = () => <Outlet />;

export default withAuthorization(security.read.role)(Roles);
