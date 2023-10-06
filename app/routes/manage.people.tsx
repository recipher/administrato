import { Outlet } from "@remix-run/react";

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import withAuthorization from "~/auth/with-authorization";

import { manage } from '~/auth/permissions';

export type Config = { client: boolean; legalEntity: boolean; heading: string; explanation: string; };

export const configs = new Map<string, Config>([
  [ "worker", { client: true, legalEntity: true, heading: "Select Memberships", explanation: "Workers need to be associated with a client and a legal entity." } ],
  [ "employee", { client: false, legalEntity: true, heading: "Select Legal Entity", explanation: "Employees need to belong to a legal entity." } ],
  [ "contractor", { client: true, legalEntity: false, heading: "Select Client", explanation: "Contractors need to be associated to a client." } ],
]);

export const handle = {
  name: () => "people",
  breadcrumb: ({ current, name }: BreadcrumbProps) => 
    <Breadcrumb to={`/manage/people/worker`} name={name} current={current} />
};

const People = () => <Outlet />;

export default withAuthorization(manage.read.worker)(People);
