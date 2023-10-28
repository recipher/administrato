import { Outlet } from "@remix-run/react";

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";

export const handle = {
  help: "manage",
  name: "manage",
  path: "manage",
  breadcrumb: (props: BreadcrumbProps) => <Breadcrumb to='/manage' {...props} />
};

export default () => <Outlet />;
