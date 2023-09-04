import { cssBundleHref } from "@remix-run/css-bundle";
import { json, type LinksFunction, type LoaderArgs } from "@remix-run/node";
import { auth } from "~/auth/auth.server";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import { getSessionFlash } from "./utility/flash.server";
import Layout from '~/layout/layout';
import Progress from '~/components/progress';
import Toast from "./components/toast";

// import { getUser } from "~/session.server";
import stylesheet from "~/tailwind.css";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
  { rel: "stylesheet", href: "https://rsms.me/inter/inter.css" },
    // NOTE: Architect deploys the public directory to /_static/
  { rel: "icon", href: "/_static/favicon.ico" },
];

export const loader = async ({ request }: LoaderArgs) => {
  const user = await auth.authenticate("auth0", request);

  const session = await getSessionFlash(request);
  if (session && session.flash) {
    return json({ flash: session.flash, user: user._json }, { headers: session.headers });
  }

  return { user: user._json };
};

const App = ({ user, flash, children }: any) => {
  return (
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
    </html>
  );
};

export default () => {
  const data = useLoaderData();

  return (
    <App {...data}>
      <Outlet/>
    </App>
  );
};

export function CatchBoundary() {
  return (
    <App>
      <h2>Not Found</h2>
    </App>
  );
};

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);

  return (
    <App>
      <h2>Error</h2>
      <h3>{error?.message}</h3>
    </App>
  );
};