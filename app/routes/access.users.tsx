import { Outlet } from "@remix-run/react";
import { UserCircleIcon } from "@heroicons/react/24/outline";

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import withAuthorization from "~/auth/with-authorization";
import { security } from "~/auth/permissions";

export const handle = {
  name: "users",
  breadcrumb: ({ current, name }: BreadcrumbProps) => 
    <Breadcrumb Icon={UserCircleIcon} to="/access/users" name={name} current={current} />
};

const Users = () => <Outlet />;

export default withAuthorization(security.read.user)(Users);
