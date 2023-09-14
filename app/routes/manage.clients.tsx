import { Outlet } from "@remix-run/react";
import { IdentificationIcon } from "@heroicons/react/24/outline";

import { Breadcrumb } from "~/layout/breadcrumbs";
import withAuthorization from "~/auth/with-authorization";

import { manage } from '~/auth/permissions';

export const handle = {
  breadcrumb: ({ current }: { current: boolean }) => 
    <Breadcrumb Icon={IdentificationIcon} to="/manage/clients" name="clients" current={current} />
};

const Clients = () => <Outlet />;

export default withAuthorization(manage.read.client)(Clients);



