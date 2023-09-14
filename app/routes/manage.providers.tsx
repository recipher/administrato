import { Outlet } from "@remix-run/react";
import { CurrencyYenIcon } from "@heroicons/react/24/outline";

import { Breadcrumb } from "~/layout/breadcrumbs";

export const handle = {
  breadcrumb: ({ current }: { current: boolean }) => 
    <Breadcrumb Icon={CurrencyYenIcon} to='/manage/providers' name="providers" current={current} />
};

export default () => <Outlet/>;