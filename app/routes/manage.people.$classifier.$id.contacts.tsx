import { Outlet } from '@remix-run/react';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";

export const handle = {
  name: "contacts",
  breadcrumb: (props: BreadcrumbProps) => <Breadcrumb {...props} />
};

export default () => <Outlet />;