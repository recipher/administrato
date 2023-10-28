import { Outlet } from "@remix-run/react";
import { WalletIcon } from "@heroicons/react/24/outline";

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import withAuthorization from "~/auth/with-authorization";

import { manage } from '~/auth/permissions';

export const handle = {
  name: "legal-entities",
  breadcrumb: (props: BreadcrumbProps) => <Breadcrumb Icon={WalletIcon} {...props} />
};

const LegalEntities = () => <Outlet />;

export default withAuthorization(manage.read.legalEntity)(LegalEntities);
