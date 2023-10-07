import { Outlet } from "@remix-run/react";
import { GlobeEuropeAfricaIcon } from "@heroicons/react/24/outline";

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import withAuthorization from "~/auth/with-authorization";

export const handle = {
  name: "holidays",
  breadcrumb: ({ current, name }: BreadcrumbProps) => 
    <Breadcrumb Icon={GlobeEuropeAfricaIcon} to="/holidays" name={name} current={current} />
};

const Holidays = () => <Outlet />;

export default withAuthorization("scheduler:read:holiday")(Holidays);
