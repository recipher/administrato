import { useEffect, useState } from "react";
import { cssBundleHref } from "@remix-run/css-bundle";
import { json, V2_MetaFunction, type LinksFunction, type LoaderArgs } from "@remix-run/node";
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
import { CourierProvider } from "@trycourier/react-provider";

import { useChangeLanguage } from "~/hooks";
import { useTranslation } from "react-i18next";
import i18next, { i18nCookie } from "~/i18next.server";

import ToastContext from "./hooks/use-toast";

import { authenticate } from "~/auth/auth.server";
import { getSessionFlash } from "./utility/flash.server";
import Layout from '~/layout/layout';
import Progress from '~/components/progress';
import Toast from "./components/toast";
import { NotFound, Error } from "~/pages";
import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";

import stylesheet from "~/tailwind.css";

export const meta: V2_MetaFunction = () => {
  return [{ title: "Scheduler" }];
};

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
  { rel: "stylesheet", href: "https://rsms.me/inter/inter.css" },
    // NOTE: Architect deploys the public directory to /_static/
  { rel: "icon", href: "/_static/sgg.ico" },
];

export const handle = {
  i18n: [ "common", "date" ],
  help: "app"
};

export const loader = async ({ request }: LoaderArgs) => {
  const headers = new Headers();

  const locale = await i18next.getLocale(request);
  const user = await authenticate("auth0", request);
  // console.log(JSON.stringify(user, null, 2));
  const courierClientKey = process.env.COURIER_CLIENT_KEY;

  const { flash } = await getSessionFlash(request, headers);
  headers.append("Set-Cookie", await i18nCookie.serialize(locale));

  if (flash) return json({ flash, user, locale }, { headers });

  return json({ user, locale, courierClientKey });
};

const App = ({ user, flash, lang, dir, courierClientKey, children }: any) => {
  const [ toast, createToast ] = useState(flash);

  useEffect(() => {
    createToast(flash);
  }, [flash, createToast]);

  return (
    <html lang={lang} dir={dir} className="h-full bg-white">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="h-full">
        <Progress />
        <CourierProvider userId={user?.id} clientKey={courierClientKey}>
          <ToastContext.Provider value={{ toast, createToast }}>
            <Layout user={user}>
              {children}
              <Toast {...toast} />
            </Layout>
          </ToastContext.Provider>
        </CourierProvider>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
};

export default () => {
  const { locale, ...data } = useLoaderData<typeof loader>();
  const { i18n } = useTranslation();
  
  useChangeLanguage(locale);

  return (
    <App locale={locale} dir={i18n.dir()} {...data}>
      <Outlet/>
    </App>
  ); 
};

export function ErrorBoundary() {
  const error = useRouteError();
  
  // console.log(error);

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