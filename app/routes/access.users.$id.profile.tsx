import { type LoaderArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

import { badRequest, notFound } from '~/utility/errors';

import { mapProfileToUser } from '~/auth/auth.server';
import UserService, { type User } from '~/models/access/users.server';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";

import { Layout, Heading, Section, Field } from '~/components/info/info';

export const handle = {
  name: () => "profile",
  breadcrumb: ({ user, current, name }: { user: User } & BreadcrumbProps) =>
    <Breadcrumb key={user.id} to={`/access/users/${user.id}/profile`} name={name} current={current} />
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
      <Layout>
        <Heading heading={t('profile')} explanation={`Manage ${user.name}'s public profile.`} />
        <Section>
          <Field title="Name">
            <p className="text-gray-900">{user.name}</p>
            <button type="button" className="hidden font-medium text-indigo-600 hover:text-indigo-500">
              Update
            </button>
          </Field>
          <Field title="Email Address">
            <a href={`mailto:${user.email}`} className="block text-indigo-900 hover:underline">{user.email}</a>
            <button type="button" className="hidden font-medium text-indigo-600 hover:text-indigo-500">
              Update
            </button>
          </Field>
          <Field title="Position">
            <p className="block text-gray-900">{user.settings.role}</p>
            <button type="button" className="font-medium text-indigo-600 hover:text-indigo-500">
              Update
            </button>
          </Field>
        </Section>
      </Layout>
    </>
  );
};


