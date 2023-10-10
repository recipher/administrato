import { useState } from 'react';
import { redirect, type ActionArgs } from '@remix-run/node';
import { Link, useSubmit } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { useLocale } from "remix-i18next";

import { UserCircleIcon } from "@heroicons/react/24/outline";

import UserService from '~/services/access/users.server';
import refreshUser from '~/auth/refresh.server';
import { storage as flash, setFlashMessage } from '~/utility/flash.server';

import { useUser } from '~/hooks';

import Image from '~/components/image';
import Alert, { Level } from '~/components/alert';
import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import { Layout, Heading, Section, Field } from '~/components/info/info';

import classnames from "~/helpers/classnames";
import i18n from "~/i18n";

export const handle = {
  i18n: "language",
  name: "my-profile",
  breadcrumb: ({ current, name }: BreadcrumbProps) => 
    <Breadcrumb Icon={UserCircleIcon} to='/profile' name={name} current={current} />
};

export async function action({ request }: ActionArgs) {
  const service = UserService();

  let message = "", level = Level.Success;
  const { intent, ...props } = await request.json();
  let { redirectTo = "/profile" } = props;
  
  const headers = new Headers();

  if (intent === "select-organization") {
    const { organization, user: { id }} = props;
    await service.updateSettings({ id, settings: { organization: organization.auth0id }});
    message = !!organization.auth0id 
      ? `Organization Changed:Your organization has been changed to ${organization.displayName}.`
      : `Organization Removed:Your organization has been removed.`;
    level = Level.Success;

    await refreshUser({ id, request, headers });
  };
 
  if (intent === "set-language") {
    const { lng, language } = props;
    message = `Language Changed:Your language has been changed to ${language}.`;
    level = Level.Info;
    redirectTo = `${redirectTo}?lng=${lng}`;
  };

  if (intent === "set-favourite") {
    type Favourite = { name: string, pathname: string };
    const { favourite, user: { id, settings }} = props;

    const isFavourite = settings?.favourites?.map((f: Favourite) => f.pathname).includes(favourite.pathname);
    const favourites = isFavourite
      ? [ ...settings.favourites.filter((f: Favourite) => f.pathname !== favourite.pathname )]
      : [ ...(settings.favourites || []), favourite ];

    await service.updateSettings({ id, settings: { favourites }});
    await refreshUser({ id, request, headers });

    message = isFavourite 
      ? `Favourite Removed:${favourite.name} removed from favourites.`
      : `Favourite Added:${favourite.name} added to favourites.`;
    level = Level.Info;
  };
 
  const session = await setFlashMessage({ request, message, level });
  headers.append("Set-Cookie", await flash.commitSession(session));
  
  return redirect(redirectTo, { headers, status: 302 });
};

const Languages = () => {
  const { t, i18n: { getFixedT }} = useTranslation("language");
  const submit = useSubmit();
  const locale = useLocale();
  const [ current, setCurrent ] = useState<string | undefined>();

  const languages = i18n.supportedLngs
    .map((lng: string) => lng === 'en' 
      ? { lng, country: 'us' }
      : { lng, country: lng });

  const setLanguage = ((lng: string) => {
    const t = getFixedT(lng, "language"); // Have to use the new language to translate
    submit({ intent: "set-language", lng, language: t(lng) }, { method: "post", encType: "application/json" });  
  });

  return (
    <ul>
      {languages.map(({ lng, country }) => (
        <li key={lng} className="float-left">
          <div onClick={() => setLanguage(lng)} onMouseOver={() => setCurrent(lng)}>
            <Image className={classnames(locale === lng ? "opacity-80" : "grayscale opacity-40",
              "h-8 w-8 flex-none bg-white mr-4 cursor-pointer")}
              alt={t(lng)}
              src={`https://cdn.ipregistry.co/flags/twemoji/${country.toLowerCase()}.svg`} />
          </div>
          <div className={classnames(current === lng ? "visible" : "invisible", "text-sm text-gray-600")}>
            {getFixedT(lng, "language")(lng)}
          </div>
        </li>
      ))}
    </ul>
  );
};

type Favourite = { pathname: string, name: string };

const Favourites = ({ favourites }: { favourites: Array<Favourite> }) => {
  const { t } = useTranslation();
  const submit = useSubmit();
  const user = useUser();

  const handleRemove = (favourite: Favourite) => {
    submit({ favourite, intent: "set-favourite", user }, 
      { method: "POST", encType: "application/json" });
  };

  return (
    <>
      {favourites.length === 0 && <Alert title='No favourites' level={Level.Info} />}
      {favourites.length > 0 && <ul role="list" className="space-y-3 divide-y divide-gray-100 text-md leading-6">
        {favourites.map((favourite: Favourite) => (
          <li key={favourite.pathname} className="group pt-3 sm:flex cursor-pointer">

            <Link to={favourite.pathname} className="mt-1 flex justify-between gap-x-4 sm:mt-0 sm:flex-auto">
              <div className="text-gray-800 group-hover:text-gray-600">
                {favourite.name}
              </div>
              <button onClick={(e) => { e.preventDefault(); handleRemove(favourite) }}
                type="button" className="hidden group-hover:block font-medium text-red-600 hover:text-red-500">
                {t('remove')}
              </button>
            </Link>
          </li>
        ))}
      </ul>}
    </>
  );
};

export default () => {
  const { t } = useTranslation();
  const user = useUser();

  return (
    <Layout>
      <div className="space-y-12">
        <div className="grid grid-cols-1 gap-x-8 gap-y-10 border-b border-gray-900/10 pb-12 md:grid-cols-3">
          <div>
            <h2 className="text-base font-semibold leading-7 text-gray-900">{t('language')}</h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              {t('set-language')}.
            </p>
          </div>

          <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2">
            <div className="sm:col-span-4">
              <Languages />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-8 gap-y-10 border-b border-gray-900/10 pb-12 md:grid-cols-3">
          <div>
            <h2 className="text-base font-semibold leading-7 text-gray-900">{t('favourites')}</h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Access your favourite pages here.
            </p>
          </div>

          <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2">
            <div className="sm:col-span-full">
              <Favourites favourites={user?.settings.favourites} />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
