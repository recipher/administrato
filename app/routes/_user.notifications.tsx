import { BellIcon } from "@heroicons/react/24/outline";
import { Breadcrumb } from "~/layout/breadcrumbs";

export const handle = {
  breadcrumb: ({ current }: { current: boolean }) => 
    <Breadcrumb Icon={BellIcon} to='/notifications' name="my-notifications" current={current} />
};

export default () => {
  return null;
};
