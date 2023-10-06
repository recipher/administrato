import { Outlet } from "@remix-run/react";

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";

export const handle = {
  help: "manage",
  name: () => "manage",
  breadcrumb: ({ current, name }: BreadcrumbProps) => 
    <Breadcrumb to='/manage' name={name} current={current} />
};

export default () => <Outlet />;
