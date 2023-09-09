import { Outlet } from "@remix-run/react";

import { Breadcrumb } from "~/layout/breadcrumbs";

export const handle = {
  breadcrumb: ({ current }: { current: boolean }) => 
    <Breadcrumb to='/access' name="access" current={current} />
};

export default () => <Outlet />;
