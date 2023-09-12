import { json, type LoaderArgs } from '@remix-run/node';
import { requireUser } from '~/auth/auth.server';

import { manage } from '~/auth/permissions';

export const loader = async ({ request }: LoaderArgs) => {
  const user = await requireUser(request);
  const keys = user.keys.legalEntity;
  // const serviceCentres = await listServiceCentres({ keys });

  // const isoCodes = serviceCentres.map(s => s.localities || []).flat();
  // const countries = await getCountries({ isoCodes });

  return json({ legalEntities: [] }); //, countries });
};

export default function LegalEntities() {
  return null;
}
