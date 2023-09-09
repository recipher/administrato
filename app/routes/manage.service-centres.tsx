import { Outlet } from "@remix-run/react";
import { PaperClipIcon } from "@heroicons/react/24/outline";

import { Breadcrumb } from "~/layout/breadcrumbs";
import withAuthorization from "~/auth/with-authorization";

export const handle = {
  breadcrumb: ({ current }: { current: boolean }) => 
    <Breadcrumb Icon={PaperClipIcon} to="/manage/service-centres" name="service-centres" current={current} />
};

const ServiceCentres = () => <Outlet />;

export default withAuthorization("manage:read:service-centre")(ServiceCentres);




