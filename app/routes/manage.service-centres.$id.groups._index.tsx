import { json, type LoaderArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import { badRequest, notFound } from '~/utility/errors';

import ServiceCentreService, { ServiceCentre } from '~/services/manage/service-centres.server';

import Alert, { Level } from '~/components/alert';
import { List, ListContext, ListItem } from '~/components/list';
import { requireUser } from '~/auth/auth.server';
import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";

export const handle = {
  name: "groups",
  breadcrumb: ({ serviceCentre, current, name }: { serviceCentre: any } & BreadcrumbProps) => 
    <Breadcrumb to={`/manage/service-centres/${serviceCentre?.id}/groups`} name={name} current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest('Invalid request');

  const u = await requireUser(request);

  const service = ServiceCentreService(u);
  const serviceCentre = await service.getServiceCentre({ id });

  if (serviceCentre === undefined) return notFound('Service centre not found');

  const groups = await service.listServiceCentres({ parentId: id });

  return json({ serviceCentre, groups, serviceCentres: groups });
};

const Groups = () => {
  const { serviceCentre, groups } = useLoaderData();
  
  const Item = (group: ServiceCentre) => <ListItem data={group.name} />;
  const Context = (group: ServiceCentre) => <ListContext select={true} />

  return (
    <>
      {groups.length === 0 && <Alert title="No service centre groups" level={Level.Info} />}
        <List data={groups} renderItem={Item} renderContext={Context} buildTo={({ item }) => `../../${item.id}`} />
    </>
  );
};

export default Groups;
