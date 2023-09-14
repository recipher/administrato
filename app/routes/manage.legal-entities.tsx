import { Outlet } from "@remix-run/react";
import { WalletIcon } from "@heroicons/react/24/outline";

import { Breadcrumb } from "~/layout/breadcrumbs";

export const handle = {
  breadcrumb: ({ current }: { current: boolean }) => 
    <Breadcrumb Icon={WalletIcon} to='/manage/legal-entities' name="legal-entities" current={current} />
};

export default () => <Outlet />;