import { Flag } from './countries';

import { type Country } from '~/models/countries.server';

type Props = {
  localities: Array<string> | null;
  countries?: Array<Country>;
};

export const Flags = ({ localities, countries }: Props) => {
  if (localities === null) return;

  const country = (isoCode: string) => countries?.find((c: Country) => c.isoCode === isoCode);

  return (
    <p className="mt-1 flex text-xs leading-5 text-gray-500">
      {localities?.map(isoCode => {
        const locality = country(isoCode);
        const code = locality?.parent ? locality.parent : isoCode;
        return (
          <span key={code} className="mr-4">
            <span className="mr-2 text-base float-left">
              {locality?.name}
            </span>
            <Flag size={6} country={locality?.name} isoCode={code} className="float-right" />
          </span>
        );
      })}
    </p>
  );
}