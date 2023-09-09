import type { V2_MetaFunction } from "@remix-run/node";
import { GlobeAmericasIcon } from "@heroicons/react/24/outline";
import { useUser } from "~/hooks";

export const meta: V2_MetaFunction = () => [{ title: "Scheduler" }];

import { Breadcrumb } from "~/layout/breadcrumbs";
import { useTranslation } from "react-i18next";

export const handle = {
  breadcrumb: ({ current }: { current: boolean }) => 
    <Breadcrumb to="/" name="home" current={current} Icon={GlobeAmericasIcon} />
};

export default function Index() {
  const user = useUser();
  const { t } = useTranslation();

  return <div>{t("welcome")} {user.name}</div>;
}
