import { Outlet, V2_MetaFunction } from "@remix-run/react";

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";

export const meta: V2_MetaFunction = () => {
  return [{ title: "Scheduler / Access" }];
};

export const handle = {
  name: () => "access",
  breadcrumb: ({ current, name }: BreadcrumbProps) => 
    <Breadcrumb to='/access' name={name} current={current} />
};

export default () => <Outlet />;
