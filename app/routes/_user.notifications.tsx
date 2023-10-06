import { LoaderArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { BellIcon } from "@heroicons/react/24/outline";

import { Breadcrumb } from "~/layout/breadcrumbs";
import Alert, { Level } from "~/components/alert";

export const handle = {
  breadcrumb: ({ current }: { current: boolean }) => 
    <Breadcrumb Icon={BellIcon} to='/notifications' name="my-notifications" current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  return json({ notifications: [] });
};

export default () => {
  const { notifications } = useLoaderData();
  return (
    <>
      {notifications.length === 0 && <Alert level={Level.Info} title='No notifications' />}
    </>
  );
};
