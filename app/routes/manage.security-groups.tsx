import { Outlet } from "@remix-run/react";
import { MapIcon } from "@heroicons/react/24/outline";

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import withAuthorization from "~/auth/with-authorization";

import { manage } from '~/auth/permissions';

export const handle = {
  name: "security-groups",
  breadcrumb: (props: BreadcrumbProps) => <Breadcrumb Icon={MapIcon} {...props} />
};

const SecurityGroups = () => <Outlet />;

export default withAuthorization(manage.read.securityGroup)(SecurityGroups);
