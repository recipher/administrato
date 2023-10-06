import { useSearchParams } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

import Image from '../image';

import { Filter, Title, type TitleProps, type FilterProps } from './advanced';

type Props = TitleProps & FilterProps;

export default function Header({ title, subtitle, icon, filterTitle, filterParam = 'q', allowSort = true }: Props) {
  const { t } = useTranslation();

  const [ searchParams ] = useSearchParams();
  const filter = searchParams.get(filterParam) || '';
  const sort = searchParams.get('sort');

  if (typeof icon === "string") 
    icon = <Image src={icon} className="h-12 w-12 rounded-lg" />;

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="flex flex-wrap items-center justify-between sm:flex-nowrap">
        <div className="mb-4 flex items-center">
          <Title title={title} subtitle={subtitle} icon={icon} />
        </div>
        <div className="ml-4 flex flex-shrink-0">
          <Filter filter={filter} sort={sort} filterParam={filterParam} 
                  filterTitle={filterTitle} allowSort={allowSort} />
        </div>
      </div>
    </div>
  )
}
