import { json, type LoaderArgs } from '@remix-run/node';
import { badRequest } from '~/utility/errors';
import CountryService from '~/services/countries.server';

const Exceptions = [ 'GB' ];

export const loader = async ({ params }: LoaderArgs) => {
  const { country: isoCode } = params;

  if (isoCode === undefined) return badRequest('Invalid request');

  if (Exceptions.includes(isoCode)) {
    const regions = await import(`~/services/data/${isoCode}.json`);
    return json({ regions });
  }

  const regions = await CountryService().listRegionsByCountry({ parent: isoCode });

  return json({ regions });
};

