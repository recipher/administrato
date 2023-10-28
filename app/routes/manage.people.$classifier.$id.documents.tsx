import { Outlet } from '@remix-run/react';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";

export const handle = {
  name: "documents",
  breadcrumb: (props: BreadcrumbProps) => <Breadcrumb {...props} />
};

export default () => <Outlet />;