import { Outlet } from "@remix-run/react";
import { Bars3BottomLeftIcon } from "@heroicons/react/24/outline";

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";

export const handle = {
  name: "milestones",
  breadcrumb: (props: BreadcrumbProps) => <Breadcrumb Icon={Bars3BottomLeftIcon} {...props} />
};

export default () => <Outlet />;
