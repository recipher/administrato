import { Outlet } from "@remix-run/react";
import { MapIcon } from "@heroicons/react/24/outline";

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import withAuthorization from "~/auth/with-authorization";

import { manage } from '~/auth/permissions';

export const handle = {
  name: () => "service-centres",
  breadcrumb: ({ current, name }: BreadcrumbProps) => 
    <Breadcrumb Icon={MapIcon} to="/manage/service-centres" name={name} current={current} />
};

const ServiceCentres = () => <Outlet />;

export default withAuthorization(manage.read.serviceCentre)(ServiceCentres);
