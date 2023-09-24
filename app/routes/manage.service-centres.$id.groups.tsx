import { json, type LoaderArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import { badRequest, notFound } from '~/utility/errors';

import ServiceCentreService, { ServiceCentre } from '~/models/manage/service-centres.server';

import Alert, { Level } from '~/components/alert';
import { List, ListContext, ListItem } from '~/components/list';
import { requireUser } from '~/auth/auth.server';
import { Breadcrumb } from "~/layout/breadcrumbs";

import toNumber from '~/helpers/to-number';

export const handle = {
  breadcrumb: ({ serviceCentre, current }: { serviceCentre: any, current: boolean }) => 
    <Breadcrumb to={`/manage/serviceCentres/${serviceCentre?.id}/holidays`} name="holidays" current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const id = toNumber(params.id as string);

  if (id === undefined) return badRequest('Invalid request');

  const u = await requireUser(request);

  const service = ServiceCentreService(u);
  const serviceCentre = await service.getServiceCentre({ id });

  if (serviceCentre === undefined) return notFound('Service centre not found');

  const groups = await service.listServiceCentres({ parentId: id });

  return json({ serviceCentre, groups });
};

const Groups = () => {
  const { serviceCentre, groups } = useLoaderData();
  
  const Item = (group: ServiceCentre) => <ListItem data={group.name} />;
  const Context = (group: ServiceCentre) => <ListContext chevron={true} />

  return (
    <>
      {groups.length === 0 && <Alert title="No service centre groups" level={Level.Info} />}
        <List data={groups} renderItem={Item} renderContext={Context} />
    </>
  );
};

export default Groups;
