import { type Country } from '~/services/countries.server';
import Image from '~/components/image';
import classnames from '~/helpers/classnames';

const KOSOVO = 'xk';
const UNITED_NATIONS = 'un';

type FlagProps = {
  country?: string | undefined;
  isoCode: string | null;
  size?: number;
  className?: string;
};

export const flag = (isoCode: string) =>
  `https://cdn.ipregistry.co/flags/twemoji/${isoCode.toLowerCase()}.svg`;

export const Flag = ({ country, isoCode, size = 12, className = "" }: FlagProps) => {
  if (!isoCode) return <div className={classnames(className, `h-${size} w-${size} flex-none bg-white`)} />
  
  const noFlag = [KOSOVO, UNITED_NATIONS].includes(isoCode.toLowerCase());
  const src = noFlag
    ? `/_static/images/${isoCode.toLowerCase()}.png`
    : flag(isoCode);

  return <Image className={classnames(className, noFlag ? `h-${size-3} mt-1 rounded-md` : `h-${size}`, "flex-none bg-white")} fallbackSrc='https://cdn.ipregistry.co/flags/twemoji/gb.svg'
    src={src} alt={country} />
};

type FlagsProps = {
  localities: Array<string | null> | null;
  countries?: Array<Country>;
};

export const Flags = ({ localities, countries }: FlagsProps) => {
  if (localities === null || localities.length === 0 || localities?.at(0) == null) return;

  const country = (isoCode: string | null) => countries?.find((c: Country) => c.isoCode === isoCode);

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