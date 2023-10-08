import { json, type LoaderArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

import { PlusIcon } from '@heroicons/react/24/outline';

import { requireUser } from '~/auth/auth.server';

import MilestoneService, { type MilestoneSet } from '~/services/scheduler/milestones.server';
import Header from '~/components/header/advanced';
import Alert, { Level } from '~/components/alert';
import { List, ListContext, ListItem } from '~/components/list';

export const loader = async ({ request }: LoaderArgs) => {
  const u = await requireUser(request);

  const service = MilestoneService(u);

  const milestoneSets = await service.listMilestoneSets();

  return json({ milestoneSets });
};

export default function MilestoneSets() {
  const { t } = useTranslation();
  const { milestoneSets } = useLoaderData();

  const Item = (set: MilestoneSet) => <ListItem data={set.identifier} />;

  const Context = (set: MilestoneSet) => 
    <ListContext data={`${set.milestones.length} ${t('milestones')}`} open={true} />

  const actions = [
    { title: "add-milestone-set", to: "/milestones/add", icon: PlusIcon },
  ];

  return (
    <>
      <Header title='milestone-sets' actions={actions} />

      {milestoneSets.length <= 0 && <Alert title={`No milestone sets found`} level={Level.Warning} />}

      <List data={milestoneSets} renderItem={Item} renderContext={Context} />
    </>
  );
}
