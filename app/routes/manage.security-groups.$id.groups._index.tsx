import { json, type LoaderArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import { badRequest, notFound } from '~/utility/errors';

import SecurityGroupService, { SecurityGroup } from '~/services/manage/security-groups.server';

import Alert, { Level } from '~/components/alert';
import { List, ListContext, ListItem } from '~/components/list';
import { requireUser } from '~/auth/auth.server';
import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";

export const handle = {
  name: "groups",
  breadcrumb: ({ securityGroup, current, name }: { securityGroup: any } & BreadcrumbProps) => 
    <Breadcrumb to={`/manage/security-groups/${securityGroup?.id}/groups`} name={name} current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest('Invalid request');

  const u = await requireUser(request);

  const service = SecurityGroupService(u);
  const securityGroup = await service.getSecurityGroup({ id });

  if (securityGroup === undefined) return notFound('Security group not found');

  const groups = await service.listSecurityGroups({ parentId: id });

  return json({ securityGroup, groups, securityGroups: groups });
};

const Groups = () => {
  const { securityGroup, groups } = useLoaderData();
  
  const Item = (group: SecurityGroup) => <ListItem data={group.name} />;
  const Context = (group: SecurityGroup) => <ListContext select={true} />

  return (
    <>
      {groups.length === 0 && <Alert title="No groups" level={Level.Info} />}
        <List data={groups} renderItem={Item} renderContext={Context} buildTo={({ item }) => `../../${item.id}`} />
    </>
  );
};

export default Groups;
