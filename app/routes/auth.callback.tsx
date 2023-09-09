import type { LoaderFunction } from "@remix-run/node";

import { auth } from "~/auth/auth.server";

export const loader: LoaderFunction = async ({ request }) => {
  return auth.authenticate("auth0", request, {
    successRedirect: "/",
    failureRedirect: "/denied",
  });
};
