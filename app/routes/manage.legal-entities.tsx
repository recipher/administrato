import { Outlet } from "@remix-run/react";
import { WalletIcon } from "@heroicons/react/24/outline";

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import withAuthorization from "~/auth/with-authorization";

import { manage } from '~/auth/permissions';

export const handle = {
  name: "legal-entities",
  breadcrumb: ({ current, name }: BreadcrumbProps) => 
    <Breadcrumb Icon={WalletIcon} to="/manage/legal-entities" name={name} current={current} />
};

const LegalEntities = () => <Outlet />;

export default withAuthorization(manage.read.legalEntity)(LegalEntities);
