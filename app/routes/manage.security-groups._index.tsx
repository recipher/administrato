import { json, type LoaderArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { PlusIcon } from '@heroicons/react/20/solid';

import SecurityGroupService, { type SecurityGroup } from '~/services/manage/security-groups.server';
import CountryService from '~/services/countries.server';

import { Basic as Header } from "~/components/header";
import Alert, { Level } from '~/components/alert';
import { requireUser } from '~/auth/auth.server';

import { Flags } from '~/components/countries/flag';
import { List, ListItem, ListContext } from '~/components/list';

import { manage } from '~/auth/permissions';

export const loader = async ({ request }: LoaderArgs) => {
  const url = new URL(request.url);
  const allowFullAccess = url.searchParams.get("full") === "true";

  const user = await requireUser(request);
  
  const securityGroupService = SecurityGroupService(user);
  const securityGroups = await securityGroupService.listSecurityGroups({ allowFullAccess });

  const isoCodes = securityGroups.map(s => s.localities || []).flat();
  const countryService = CountryService();
  const countries = await countryService.getCountries({ isoCodes });

  return json({ securityGroups, countries });
};

const actions = [
  { title: "add-security-group", to: "add", icon: PlusIcon, permission: manage.create.securityGroup },
];

export default function SecurityGroups() {
  const { securityGroups, countries } = useLoaderData();

  const Context = (securityGroup: SecurityGroup) =>
    <ListContext select={true} />;

  const Item = (securityGroup: SecurityGroup) =>
    <ListItem data={securityGroup.name} sub={<Flags localities={securityGroup.localities} countries={countries} />} />

  return (
    <>
      <Header title="Security Groups" actions={actions} />

      {securityGroups.length === 0 && <Alert title="No security groups found" level={Level.Warning} />}
      <List data={securityGroups} renderItem={Item} renderContext={Context} />
    </>
  );
}
