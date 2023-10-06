import { json, type LoaderArgs } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

import ServiceCentreService from '~/models/manage/service-centres.server';
import { requireUser } from '~/auth/auth.server';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";

import { notFound, badRequest } from '~/utility/errors';
import { Layout, Heading, Section, Field } from '~/components/info/info';

export const handle = {
  name: () => "info",
  breadcrumb: ({ serviceCentre, current, name }: { serviceCentre: any } & BreadcrumbProps) => 
    <Breadcrumb to={`/manage/service-centres/${serviceCentre?.id}/info`} name={name} current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest('Invalid request');

  const u = await requireUser(request);

  const service = ServiceCentreService(u);
  const serviceCentre = await service.getServiceCentre({ id });

  if (serviceCentre === undefined) return notFound('Service centre not found');

  return json({ serviceCentre });
};

const Info = () => {
  const { t } = useTranslation();
  const { serviceCentre } = useLoaderData();

  return (
    <>
      <Layout>
        <Heading heading={t('info')} explanation={`Manage ${serviceCentre.name}'s information.`} />
        <Section>
          <Field title="Service Centre Name">
            {!serviceCentre.parentId && <p className="text-gray-900">{serviceCentre.name}</p>}
            {serviceCentre.parentId && <Link className="text-indigo-900" to={`/manage/service-centres/${serviceCentre.parentId}/info`}>
              {serviceCentre.parent}
            </Link>}
            <button type="button" className="hidden font-medium text-indigo-600 hover:text-indigo-500">
              Update
            </button>
          </Field>
          {serviceCentre.parentId && <Field title="Group Name">
            <p className="text-gray-900">{serviceCentre.name}</p>
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
