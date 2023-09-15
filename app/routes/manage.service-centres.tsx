import { Outlet } from "@remix-run/react";
import { MapIcon } from "@heroicons/react/24/outline";

import { Breadcrumb } from "~/layout/breadcrumbs";
import withAuthorization from "~/auth/with-authorization";

import { manage } from '~/auth/permissions';

export const handle = {
  breadcrumb: ({ current }: { current: boolean }) => 
    <Breadcrumb Icon={MapIcon} to="/manage/service-centres" name="service-centres" current={current} />
};

const ServiceCentres = () => <Outlet />;

export default withAuthorization(manage.read.serviceCentre)(ServiceCentres);
