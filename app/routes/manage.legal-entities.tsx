import { Outlet } from "@remix-run/react";
import { WalletIcon } from "@heroicons/react/24/outline";

import { Breadcrumb } from "~/layout/breadcrumbs";
import withAuthorization from "~/auth/with-authorization";

import { manage } from '~/auth/permissions';

export const handle = {
  breadcrumb: ({ current }: { current: boolean }) => 
    <Breadcrumb Icon={WalletIcon} to="/manage/legal-entities" name="legal-entities" current={current} />
};

const LegalEntities = () => <Outlet />;

export default withAuthorization(manage.read.legalEntity)(LegalEntities);
