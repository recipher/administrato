import { type LoaderArgs, json } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import { CubeIcon } from "@heroicons/react/24/outline";

import { Breadcrumb } from "~/layout/breadcrumbs";
import withAuthorization from "~/auth/with-authorization";

import { manage } from '~/auth/permissions';
import { Classifier } from "~/models/manage/people.server";
import pluralize from "~/helpers/pluralize";

export const handle = {
  breadcrumb: ({ classifier, current }: { classifier: Classifier, current: boolean }) => 
    <Breadcrumb Icon={CubeIcon} to={`/manage/people/${classifier}`} name={pluralize(classifier)} current={current} />
};

export const loader = async ({ params }: LoaderArgs) => {
  const { classifier } = params;

  return json({ classifier });
};

const People = () => <Outlet />;

export default withAuthorization(manage.read.worker)(People);
