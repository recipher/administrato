import { Outlet } from "@remix-run/react";
import { GlobeEuropeAfricaIcon } from "@heroicons/react/24/outline";

import { Breadcrumb } from "~/layout/breadcrumbs";
import withAuthorization from "~/auth/with-authorization";

export const handle = {
  breadcrumb: ({ current }: { current: boolean }) => 
    <Breadcrumb Icon={GlobeEuropeAfricaIcon} to="/holidays" name="holidays" current={current} />
};

const Holidays = () => <Outlet />;

export default withAuthorization("scheduler:read:holiday")(Holidays);
