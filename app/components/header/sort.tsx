import { BarsArrowUpIcon, BarsArrowDownIcon, ChevronDownIcon } from '@heroicons/react/20/solid'
import { useNavigate, useSearchParams } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

type Props = {
  sort: string | null;
};

const ASC = 'asc', DESC = 'desc';

export default function Sort({ sort }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (sort == null || (sort !== ASC && sort !== DESC)) sort = ASC;

  let [ prop, direction ] = sort.split(':');

  if (direction === undefined) direction = prop;

  const Icon = direction === ASC ? BarsArrowDownIcon : BarsArrowUpIcon;

  const [ searchParams ] = useSearchParams();
  const qs = searchParams.toString() || '';

  const params = new URLSearchParams(qs);
  params.set("sort", direction === ASC ? DESC : ASC);

  return (
    <button onClick={() => navigate(`?${params.toString()}`)}
      type="button"
      className="relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-md px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
    >
      <Icon className="-ml-0.5 h-5 w-5 text-gray-400" aria-hidden="true" />
      {t('sort')}
      {/* <ChevronDownIcon className="-mr-1 h-5 w-5 text-gray-400" aria-hidden="true" /> */}
    </button>
  );
}
