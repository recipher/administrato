import { useState } from 'react';
import { redirect, type ActionArgs } from '@remix-run/node';
import { useSubmit } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { useLocale } from "remix-i18next";

import { UserCircleIcon } from "@heroicons/react/24/outline";

import { updateSettings, getTokenizedUser } from '~/models/users.server';
import { getSession, storage, mapProfileToUser } from '~/auth/auth.server';
import { getSession as getFlashSession, storage as flash, setFlashMessage } from '~/utility/flash.server';

import Image from '~/components/image';
import { Level } from '~/components/alert';
import { Breadcrumb } from "~/layout/breadcrumbs";

import classnames from "~/helpers/classnames";
import i18n from "~/i18n";

export const handle = {
  i18n: "language",
  breadcrumb: ({ current }: { current: boolean }) => 
    <Breadcrumb Icon={UserCircleIcon} to='/profile' name="my-profile" current={current} />
};

export async function action({ request }: ActionArgs) {
  let message = "", level = Level.Success;
  const { intent, ...props } = await request.json();
  let { redirectTo = "/profile" } = props;
  
  const headers = new Headers();

  if (intent === "select-organization") {
    const { organization, user: { id }} = props;
    await updateSettings({ id, settings: { organization: organization.auth0id }});
    message = !!organization.auth0id 
      ? `Organization Changed:Your organization has been changed to ${organization.displayName}.`
      : `Organization Removed:Your organization has been removed.`;
    level = Level.Success;

    const session = await getSession(request.headers.get("Cookie"));
    const profile = await getTokenizedUser({ id });
    session.set("user", mapProfileToUser(id, profile));
    headers.append("Set-Cookie", await storage.commitSession(session));
  };
 
  if (intent === "set-language") {
    const { lng, language } = props;
    message = `Language Changed:Your language has been changed to ${language}.`;
    level = Level.Info;
    redirectTo = `${redirectTo}?lng=${lng}`;
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
    .map((lng: string) => lng === 'en' ? { lng, country: 'us' } : { lng, country: lng });

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
}

export default () => {
  const { t } = useTranslation();

  return (
    <form>
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

        <div className="hidden grid grid-cols-1 gap-x-8 gap-y-10 border-b border-gray-900/10 pb-12 md:grid-cols-3">
          <div>
            <h2 className="text-base font-semibold leading-7 text-gray-900">{t('profile')}</h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              This information will be displayed publicly so be careful what you share.
            </p>
          </div>

          <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2">
            <div className="sm:col-span-4">
              <label htmlFor="website" className="block text-sm font-medium leading-6 text-gray-900">
                Website
              </label>
              <div className="mt-2">
                <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:max-w-md">
                  <span className="flex select-none items-center pl-3 text-gray-500 sm:text-sm">http://</span>
                  <input
                    type="text"
                    name="website"
                    id="website"
                    className="block flex-1 border-0 bg-transparent py-1.5 pl-1 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                    placeholder="www.example.com"
                  />
                </div>
              </div>
            </div>

            <div className="col-span-full">
              <label htmlFor="about" className="block text-sm font-medium leading-6 text-gray-900">
                About
              </label>
              <div className="mt-2">
                <textarea
                  id="about"
                  name="about"
                  rows={3}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  defaultValue={''}
                />
              </div>
              <p className="mt-3 text-sm leading-6 text-gray-600">Write a few sentences about yourself.</p>
            </div>
          </div>
        </div>

        <div className="hidden grid grid-cols-1 gap-x-8 gap-y-10 border-b border-gray-900/10 pb-12 md:grid-cols-3">
          <div>
            <h2 className="text-base font-semibold leading-7 text-gray-900">Personal Information</h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">Use a permanent address where you can receive mail.</p>
          </div>

          <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2">
            <div className="sm:col-span-3">
              <label htmlFor="first-name" className="block text-sm font-medium leading-6 text-gray-900">
                First name
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="first-name"
                  id="first-name"
                  autoComplete="given-name"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="last-name" className="block text-sm font-medium leading-6 text-gray-900">
                Last name
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="last-name"
                  id="last-name"
                  autoComplete="family-name"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div className="sm:col-span-4">
              <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                Email address
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden mt-6 flex items-center justify-end gap-x-6">
        <button type="button" className="text-sm font-semibold leading-6 text-gray-900">
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Save
        </button>
      </div>
    </form>
  );
};
