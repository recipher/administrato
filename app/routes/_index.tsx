import type { V2_MetaFunction } from "@remix-run/node";
import { GlobeAmericasIcon } from "@heroicons/react/24/outline";
import { useUser } from "~/hooks";

export const meta: V2_MetaFunction = () => [{ title: "Scheduler" }];

import { Breadcrumb } from "~/layout/breadcrumbs";

export const handle = {
  breadcrumb: ({ current }: { current: boolean }) => 
    <Breadcrumb to="/" name="Dashboard" current={current} Icon={GlobeAmericasIcon} />
};

export default function Index() {
  const user = useUser();
  return <div>Welcome {user.name}</div>;
}
