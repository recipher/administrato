import { cssBundleHref } from "@remix-run/css-bundle";
import type { LinksFunction, LoaderArgs } from "@remix-run/node";
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
import Layout from '~/layout/layout';
import Progress from '~/components/progress';

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

  return { user: user._json };
};

export default function App() {
  const { user } = useLoaderData();

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
          <Outlet />
        </Layout>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

export function CatchBoundary() {
  // const params = useParams();
  return (
    <div>
      <h2>We couldn't find that page!</h2>
    </div>
  );
}