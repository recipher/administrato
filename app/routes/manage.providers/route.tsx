import { Outlet } from "@remix-run/react";
import { ReceiptPercentIcon } from "@heroicons/react/24/outline";

import { Breadcrumb } from "~/layout/breadcrumbs";

export const handle = {
  breadcrumb: ({ current }: { current: boolean }) => 
    <Breadcrumb Icon={ReceiptPercentIcon} to='/manage/providers' name="Providers" current={current} />
};

export default () => <Outlet/>;