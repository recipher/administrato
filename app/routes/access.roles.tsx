import { Outlet } from "@remix-run/react";
import { UsersIcon } from "@heroicons/react/24/outline";

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import withAuthorization from "~/auth/with-authorization";
import { security } from "~/auth/permissions";

export const handle = {
  name: "roles",
  breadcrumb: (props: BreadcrumbProps) => <Breadcrumb Icon={UsersIcon} {...props} />
};

const Roles = () => <Outlet />;

export default withAuthorization(security.read.role)(Roles);
