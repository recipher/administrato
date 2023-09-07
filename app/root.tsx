import { cssBundleHref } from "@remix-run/css-bundle";
import { json, type LinksFunction, type LoaderArgs } from "@remix-run/node";
import { auth, mapProfileToUser } from "~/auth/auth.server";
import {
  isRouteErrorResponse,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRouteError,
} from "@remix-run/react";
import { getSessionFlash } from "./utility/flash.server";
import Layout from '~/layout/layout';
import Progress from '~/components/progress';
import Toast from "./components/toast";
import { NotFound, Error } from "~/pages";

import stylesheet from "~/tailwind.css";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
  { rel: "stylesheet", href: "https://rsms.me/inter/inter.css" },
    // NOTE: Architect deploys the public directory to /_static/
  { rel: "icon", href: "/_static/favicon.ico" },
];

export const loader = async ({ request }: LoaderArgs) => {
  const profile = await auth.authenticate("auth0", request);
  const user = mapProfileToUser(profile);
  // console.log(user);
  const { flash, headers } = await getSessionFlash(request);
  if (flash) return json({ flash, user }, { headers });

  return { user };
};

const App = ({ user, flash, children }: any) =>
  <html lang="en" className="h-full bg-white">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <Meta />
      <Links />
    </head>
    <body className="h-full">
      <Progress />
      <Layout user={user}>
        {children}
        <Toast level={flash?.level} title={flash?.text} />
      </Layout>
      <ScrollRestoration />
      <Scripts />
      <LiveReload />
    </body>
  </html>;

export default () => {
  const data = useLoaderData();

  return (
    <App {...data}>
      <Outlet/>
    </App>
  );
};

export function ErrorBoundary() {
  const error = useRouteError();
  
  console.log(error);

  if (isRouteErrorResponse(error)) {
    return (
      <App>
        {error.status === 404
          ? <NotFound message={error.statusText} />
          : <Error message={error.statusText} code={error.status} />
        }
      </App>
    );
  }

  let message = "Unknown error";
  if (error instanceof Error) message = (error as Error).message;

  return (
    <App>
      <Error error={message} />
    </App>
  );
};