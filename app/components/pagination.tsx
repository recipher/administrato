import { ArrowLongLeftIcon, ArrowLongRightIcon } from '@heroicons/react/24/outline';
import { Link, useSearchParams } from '@remix-run/react';
import pluralize from '~/helpers/pluralize';

const NO_COUNT = -1;

type Props = {
  offset?: number;
  limit: number;
  totalItems?: number;
  entity: string;
  count?: number;
  onPage?: Function;
};

export default function Pagination({ offset = 0, limit, totalItems = NO_COUNT, count, entity, onPage }: Props) {
  const from = totalItems <= 0 ? 0 : offset + 1, to = totalItems < offset + limit && totalItems !== NO_COUNT ? totalItems : offset + limit;
  const isEnd = (count === 0 || (count && count < limit) || offset + limit >= totalItems && totalItems !== NO_COUNT), 
        isStart = offset - limit < 0;
  const next = isEnd ? offset : offset + limit, 
        previous = isStart ? offset : offset - limit;

  const [ searchParams ] = useSearchParams();
  const qs = searchParams.toString() || '';

  const nextParams = new URLSearchParams(qs), previousParams = new URLSearchParams(qs);
  nextParams.set("offset", next.toString());
  previousParams.set("offset", previous.toString());

  const Next = () => {
    const className = "cursor-pointer inline-flex items-center pl-4 pb-4 text-sm font-medium text-gray-500 hover:text-gray-700";
    const Arrow = () => <ArrowLongRightIcon className="ml-3 h-5 w-5 text-gray-400" aria-hidden="true" />;
    return onPage 
      ? <div className={className} onClick={() => onPage(next)}>
          {'Next'}<Arrow />
        </div>
      : <Link to={`?${nextParams.toString()}`} className={className}>
          {'Next'}<Arrow />
        </Link>
  };

  const Previous = () => {
    const className = "cursor-pointer inline-flex items-center pr-4 pb-4 text-sm font-medium text-gray-500 hover:text-gray-700";
    const Arrow = () => <ArrowLongLeftIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />;
    return onPage 
      ? <div className={className} onClick={() => onPage(previous)}>
          <Arrow />{'Previous'}
        </div>
      : <Link to={`?${previousParams.toString()}`} className={className}>
          {'Previous'}<Arrow />
        </Link>
  };

  return (
    <nav
      className="flex items-center justify-between bg-white py-3"
      aria-label="Pagination"
    >
      {totalItems !== NO_COUNT && <div className="hidden sm:block">
        <p className="text-sm text-gray-700">
          Showing{' '}
          {totalItems > 0 && <><span className="font-medium">{from}</span><span>{' to '}</span><span className="font-medium">{to}</span> of{' '}</>}
          <span className="font-medium">{totalItems}</span> {pluralize(entity, totalItems)}
        </p>
      </div>}
      <div className="flex flex-1 justify-between sm:justify-end mt-3">
        {isStart
          ? <div className="inline-flex items-center pr-4 pb-4 text-sm font-medium text-gray-300">
              <ArrowLongLeftIcon className="mr-3 h-5 w-5 text-gray-200" aria-hidden="true" />
              Previous
            </div>
            : <Previous />}
        {isEnd
          ? <div className="inline-flex items-center pl-4 pb-4 text-sm font-medium text-gray-300">
              Next
              <ArrowLongRightIcon className="ml-3 h-5 w-5 text-gray-200" aria-hidden="true" />
            </div>
          : <Next />}
      </div>
    </nav>
  )
}
