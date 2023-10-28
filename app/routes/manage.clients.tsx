import { Outlet } from "@remix-run/react";
import { IdentificationIcon } from "@heroicons/react/24/outline";

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import withAuthorization from "~/auth/with-authorization";

import { manage } from '~/auth/permissions';

export const handle = {
  name: "clients",
  breadcrumb: (props: BreadcrumbProps) => <Breadcrumb Icon={IdentificationIcon} {...props} />
};

const Clients = () => <Outlet />;

export default withAuthorization(manage.read.client)(Clients);



