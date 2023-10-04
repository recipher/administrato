import { Outlet } from "@remix-run/react";
import { CubeIcon } from "@heroicons/react/24/outline";

import { Breadcrumb } from "~/layout/breadcrumbs";
import withAuthorization from "~/auth/with-authorization";

import { manage } from '~/auth/permissions';

export const handle = {
  breadcrumb: ({ current }: { current: boolean }) => 
    <Breadcrumb Icon={CubeIcon} to="/manage/employees" name="employees" current={current} />
};

const Employees = () => <Outlet />;

export default withAuthorization(manage.read.worker)(Employees);
