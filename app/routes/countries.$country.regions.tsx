import { json, type LoaderArgs } from '@remix-run/node';
import { badRequest } from '~/utility/errors';
import fs from 'node:fs/promises';

import CountryService from '~/services/countries.server';

const Exceptions = [ 'GB' ];

export const loader = async ({ params }: LoaderArgs) => {
  const { country: isoCode } = params;

  if (isoCode === undefined) return badRequest('Invalid request');

  if (Exceptions.includes(isoCode)) {
    const regions = await fs.readFile(`../public/data/regions/${isoCode}.json`, { encoding: 'utf-8' });
    return json({ regions: JSON.parse(regions) });
  }

  const regions = await CountryService().listRegionsByCountry({ parent: isoCode });

  return json({ regions });
};

