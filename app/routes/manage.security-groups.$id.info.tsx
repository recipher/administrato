import { json, type LoaderArgs } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

import SecurityGroupService from '~/services/manage/security-groups.server';
import { requireUser } from '~/auth/auth.server';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";

import { notFound, badRequest } from '~/utility/errors';
import { Layout, Heading, Section, Field } from '~/components/info/info';

export const handle = {
  name: "info",
  breadcrumb: ({ securityGroup, current, name }: { securityGroup: any } & BreadcrumbProps) => 
    <Breadcrumb to={`/manage/security-groups/${securityGroup?.id}/info`} name={name} current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest('Invalid request');

  const u = await requireUser(request);

  const service = SecurityGroupService(u);
  const securityGroup = await service.getSecurityGroup({ id });

  if (securityGroup === undefined) return notFound('Security group not found');

  return json({ securityGroup });
};

const Info = () => {
  const { t } = useTranslation();
  const { securityGroup } = useLoaderData();

  return (
    <>
      <Layout>
        <Heading heading={t('info')} explanation={`Manage ${securityGroup.name}'s information.`} />
        <Section>
          <Field title="Security Group Name">
            {!securityGroup.parentId && <p className="text-gray-900">{securityGroup.name}</p>}
            {securityGroup.parentId && <Link className="text-indigo-900" to={`/manage/security-groups/${securityGroup.parentId}/info`}>
              {securityGroup.parent}
            </Link>}
            <button type="button" className="hidden font-medium text-indigo-600 hover:text-indigo-500">
              Update
            </button>
          </Field>
          {securityGroup.parentId && <Field title="Group Name">
            <p className="text-gray-900">{securityGroup.name}</p>
            <button type="button" className="hidden font-medium text-indigo-600 hover:text-indigo-500">
              Update
            </button>
          </Field>}
        </Section>
      </Layout>
    </>
  );
};


export default Info;
