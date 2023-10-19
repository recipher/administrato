import { json, type LoaderArgs } from '@remix-run/node';
import { Outlet, useLoaderData, useSearchParams } from '@remix-run/react';
import { PlusIcon } from '@heroicons/react/24/outline';

import { badRequest, notFound } from '~/utility/errors';
import { requireUser } from '~/auth/auth.server';

import CountryService from '~/services/countries.server';
import SecurityGroupService from '~/services/manage/security-groups.server';
import Header from '~/components/header';
import { Flag } from '~/components/countries/flag';
import { manage } from '~/auth/permissions';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";

export const handle = {
  name: ({ securityGroup, parent }: { securityGroup: any, parent: any }) => parent !== null ?  [ parent?.name, "groups", securityGroup?.name ] : securityGroup?.name,
  breadcrumb: ({ securityGroup, parent, current, name }: { securityGroup: any, parent: any } & BreadcrumbProps) => {
    const crumb = <Breadcrumb key={securityGroup.id} to={`/manage/security-groups/${securityGroup?.id}`} name={Array.isArray(name) ? name[2] : name} current={current} />;
    return parent === null ? crumb : [ 
      <Breadcrumb key={parent.id} to={`/manage/security-groups/${parent?.id}`} name={name[0]} />,
      <Breadcrumb key={`${parent.id}-r`} to={`/manage/security-groups/${parent?.id}/groups`} name={name[1]} />,
      crumb ];
  }
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest('Invalid request');

  const bypassKeyCheck = !!new URL(request.url).searchParams.get("bypass");

  const u = await requireUser(request);

  const service = SecurityGroupService(u);
  const securityGroup = await service.getSecurityGroup({ id }, { bypassKeyCheck });
  const parent = securityGroup.parentId ? await service.getSecurityGroup({ id: securityGroup.parentId }) : null;

  if (securityGroup === undefined && !bypassKeyCheck) return notFound('Service centre not found');

  const countryService = CountryService();
  const countries = await countryService.getCountries({ isoCodes: securityGroup.localities || [] });

  return json({ securityGroup, parent, countries });
};

export default function SecurityGroup() {
  const [ searchParams ] = useSearchParams();
  const { countries, securityGroup: { id, name, localities, parentId }} = useLoaderData();

  const country = countries.at(0);
  const isoCode = country.parent || country.isoCode;

  const tabs = [
    { name: 'info', to: 'info' },
    { name: 'groups', to: 'groups', hidden: parentId !== null },
    { name: 'clients', to: 'clients' },
    { name: 'legal-entities', to: 'legal-entities' },
    { name: 'providers', to: 'providers' },
    { name: 'locations', to: 'locations' },
    { name: 'holidays', to: 'holidays' },
  ];

  const locality = searchParams.get("locality") || localities.at(0);
  const actions = [
    { title: 'add-group', to: `/manage/security-groups/${id}/groups/add`, hidden: parentId !== null, permission: manage.edit.securityGroup },
    { title: 'add-client', to: `/manage/clients/add?security-group=${id}`, default: true, icon: PlusIcon, permission: manage.create.client },
    { title: 'add-legal-entity', to: `/manage/legal-entities/add?security-group=${id}`, permission: manage.create.legalEntity },
    { title: 'add-provider', to: `/manage/providers/add?security-group=${id}`, permission: manage.create.provider },
    { title: 'add-holiday', to: `/holidays/${locality}/add?entity=security-group&entity-id=${id}`, default: true, icon: PlusIcon, permission: manage.edit.securityGroup },
  ];

  return (
    <>
      <Header title={name} icon={<Flag isoCode={isoCode} />} tabs={tabs} actions={actions} group={true} />
      <Outlet />
    </>
  );
};
