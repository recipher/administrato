import { Outlet } from "@remix-run/react";
import { UserCircleIcon } from "@heroicons/react/24/outline";

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import withAuthorization from "~/auth/with-authorization";
import { security } from "~/auth/permissions";

export const handle = {
  name: "users",
  breadcrumb: (props: BreadcrumbProps) => <Breadcrumb Icon={UserCircleIcon} {...props} />
};

const Users = () => <Outlet />;

export default withAuthorization(security.read.user)(Users);
