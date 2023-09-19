import { Outlet, V2_MetaFunction } from "@remix-run/react";

import { Breadcrumb } from "~/layout/breadcrumbs";

export const meta: V2_MetaFunction = () => {
  return [{ title: "Scheduler / Access" }];
};

export const handle = {
  breadcrumb: ({ current }: { current: boolean }) => 
    <Breadcrumb to='/access' name="access" current={current} />
};

export default () => <Outlet />;
