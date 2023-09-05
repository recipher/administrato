import { Outlet } from "@remix-run/react";
import { GlobeEuropeAfricaIcon } from "@heroicons/react/24/outline";

import { Breadcrumb } from "~/layout/breadcrumbs";

export const handle = {
  breadcrumb: ({ current }: { current: boolean }) => 
    <Breadcrumb Icon={GlobeEuropeAfricaIcon} to="/holidays" name="Holidays" current={current} />
};

export default function Holidays() {
  return (
    <>
      <div className="mt-5">
        <Outlet/>
      </div>
    </>
  );
}
