import { Outlet, V2_MetaFunction } from "@remix-run/react";

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";

export const meta: V2_MetaFunction = () => {
  return [{ title: "Scheduler / Access" }];
};

export const handle = {
  name: "access",
  breadcrumb: (props: BreadcrumbProps) => <Breadcrumb {...props} />
};

export default () => <Outlet />;
