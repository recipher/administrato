import { Outlet } from "@remix-run/react";
import { CubeIcon } from "@heroicons/react/24/outline";

import { Breadcrumb } from "~/layout/breadcrumbs";
import withAuthorization from "~/auth/with-authorization";

import { manage } from '~/auth/permissions';

export const handle = {
  breadcrumb: ({ current }: { current: boolean }) => 
    <Breadcrumb Icon={CubeIcon} to="/manage/contractors" name="contractors" current={current} />
};

const Contractors = () => <Outlet />;

export default withAuthorization(manage.read.worker)(Contractors);
