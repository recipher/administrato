import { useRef, useState } from 'react';
import { ActionArgs, redirect, type LoaderArgs } from '@remix-run/node';
import { useLoaderData, useSubmit } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

import { badRequest, notFound } from '~/utility/errors';

import { setFlashMessage, storage } from '~/utility/flash.server';
import { mapProfileToUser, requireUser } from '~/auth/auth.server';
import UserService, { type User } from '~/models/access/users.server';

import ConfirmModal, { RefConfirmModal } from "~/components/modals/confirm";
import { SelectorModal, RefSelectorModal, entities } from '~/components/manage/selector';
import Alert, { Level } from '~/components/alert';

import { Breadcrumb } from "~/layout/breadcrumbs";
import ButtonGroup, { type ButtonGroupButton } from '~/components/button-group';

export const handle = {
  breadcrumb: ({ user, current }: { user: User, current: boolean }) =>
    <Breadcrumb key={user.id} to={`/access/users/${user.id}/profile`} name="profile" current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest();

  const service = UserService();
  const profile = await service.getTokenizedUser({ id });

  if (profile === undefined) return notFound();
  const user = mapProfileToUser(id, profile);

  return { user, profile };
};

export default function Profile() {
  const { t } = useTranslation();
  const { user } = useLoaderData();

  return (
    <>
      <div className="px-4 py-4 sm:px-6 lg:flex-auto lg:px-0 lg:py-4">
        <div className="mx-auto max-w-2xl space-y-8 sm:space-y-12 lg:mx-0 lg:max-w-none">
          <div>
            <h2 className="text-lg font-medium leading-7 text-gray-900">{t('profile')}</h2>
            <p className="mt-1 text-sm leading-6 text-gray-500">
              Manage {user.name}'s public profile.
            </p>

            <dl className="mt-6 space-y-3 divide-y divide-gray-100 border-t border-gray-200 text-sm leading-6">
              <div className="pt-6 sm:flex">
                <dt className="font-medium text-gray-900 sm:w-64 sm:flex-none sm:pr-6">Full name</dt>
                <dd className="mt-1 flex justify-between gap-x-4 sm:mt-0 sm:flex-auto">
                  <div className="text-gray-900">{user.name}</div>
                  <button type="button" className="hidden font-medium text-indigo-600 hover:text-indigo-500">
                    Update
                  </button>
                </dd>
              </div>
              <div className="pt-6 sm:flex">
                <dt className="font-medium text-gray-900 sm:w-64 sm:flex-none sm:pr-6">Email address</dt>
                <dd className="mt-1 flex justify-between gap-x-4 sm:mt-0 sm:flex-auto">
                  <a href={`mailto:${user.email}`} className="block text-indigo-900 hover:underline">{user.email}</a>
                  <button type="button" className="hidden font-medium text-indigo-600 hover:text-indigo-500">
                    Update
                  </button>
                </dd>
              </div>
              <div className="pt-6 sm:flex">
                <dt className="font-medium text-gray-900 sm:w-64 sm:flex-none sm:pr-6">Role</dt>
                <dd className="mt-1 flex justify-between gap-x-4 sm:mt-0 sm:flex-auto">
                  <p className="block text-gray-900">{user.settings.role}</p>
                  <button type="button" className="font-medium text-indigo-600 hover:text-indigo-500">
                    Update
                  </button>
                </dd>
              </div>
            </dl>
          </div>

        </div>
      </div>
    </>
  );
};


