import { Outlet } from "@remix-run/react";
import { IdentificationIcon } from "@heroicons/react/24/outline";

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import withAuthorization from "~/auth/with-authorization";

import { manage } from '~/auth/permissions';

export const handle = {
  name: "clients",
  breadcrumb: ({ current, name }: BreadcrumbProps) => 
    <Breadcrumb Icon={IdentificationIcon} to="/manage/clients" name={name} current={current} />
};

const Clients = () => <Outlet />;

export default withAuthorization(manage.read.client)(Clients);



