import { Outlet } from "@remix-run/react";
import { CurrencyYenIcon } from "@heroicons/react/24/outline";

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import withAuthorization from "~/auth/with-authorization";

import { manage } from '~/auth/permissions';

export const handle = {
  name: "providers",
  breadcrumb: ({ current, name }: BreadcrumbProps) => 
    <Breadcrumb Icon={CurrencyYenIcon} to='/manage/providers' name={name} current={current} />
};

const Providers = () => <Outlet />;

export default withAuthorization(manage.read.provider)(Providers);
