import { type LoaderArgs, json } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import { CubeIcon } from "@heroicons/react/24/outline";

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import withAuthorization from "~/auth/with-authorization";

import { manage } from '~/auth/permissions';
import { Classifier } from "~/services/manage/people.server";
import pluralize from "~/helpers/pluralize";

export const handle = {
  name: ({ classifier }: { classifier: Classifier }) => pluralize(classifier),
  breadcrumb: ({ classifier, current, name }: { classifier: Classifier } & BreadcrumbProps) => 
    <Breadcrumb Icon={CubeIcon} to={`/manage/people/${classifier}`} name={name} current={current} />
};

export const loader = async ({ params }: LoaderArgs) => {
  const { classifier } = params;

  return json({ classifier });
};

const People = () => <Outlet />;

export default withAuthorization(manage.read.worker)(People);
