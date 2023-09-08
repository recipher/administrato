import { Outlet } from "@remix-run/react";
import { UserCircleIcon } from "@heroicons/react/24/outline";

import { redirect, type ActionArgs } from '@remix-run/node';
import { Level } from '~/components/alert';
import { updateSettings, getTokenizedUser } from '~/models/users.server';
import { getSession, storage, mapProfileToUser } from '~/auth/auth.server';
import { getSession as getFlashSession, storage as flashStorage } from '~/utility/flash.server';
import { Breadcrumb } from "~/layout/breadcrumbs";

export const handle = {
  breadcrumb: ({ current }: { current: boolean }) => 
    <Breadcrumb Icon={UserCircleIcon} to='/profile' name="My Profile" current={current} />
};

export async function action({ request }: ActionArgs) {
  let message;
  const { intent, user: { id }, organization, redirectTo = "/profile" } = await request.json();

  if (intent === "select-organization") {
    await updateSettings({ id, settings: { organization: organization.auth0id }});
    message = !!organization.auth0id 
      ? `Organization Changed:Your organization has been changed to ${organization.displayName}.`
      : `Organization Removed:Your organization has been removed.`;
  };
 
  const session = await getSession(request.headers.get("Cookie"));
  const profile = await getTokenizedUser({ id });
  session.set("user", mapProfileToUser(id, profile));

  const flashSession = await getFlashSession(request);
  flashSession.flash("flashText", message);
  flashSession.flash("flashLevel", Level.Success);

  const headers = new Headers();
  headers.append("Set-Cookie", await storage.commitSession(session));
  headers.append("Set-Cookie", await flashStorage.commitSession(flashSession));
  
  return redirect(redirectTo, { headers, status: 302 });
};

export default () => <Outlet/>;
