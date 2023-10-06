import { V2_MetaFunction } from "@remix-run/node";
import { Outlet } from "@remix-run/react";

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";

export const meta: V2_MetaFunction = () => {
  return [{ title: "Scheduler / Manage" }];
};

export const handle = {
  help: "manage",
  name: () => "manage",
  breadcrumb: ({ current, name }: BreadcrumbProps) => 
    <Breadcrumb to='/manage' name={name} current={current} />
};

export default () => <Outlet />;
