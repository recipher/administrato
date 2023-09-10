import { useEffect, RefObject, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFetcher } from '@remix-run/react'
import { type Country } from '~/models/countries.server';
import Modal, { RefModal } from '~/components/modals/modal';
import { List } from '~/components/list';
import Image from '~/components/image';
import { ChevronRightIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Pagination from '../pagination';
import pluralize from '~/helpers/pluralize';

const LIMIT = 6;

export const Filter = ({ onFilter }: { onFilter: Function }) => {
  const { t } = useTranslation();
  const [ text, setText ] = useState('');

  const handleSubmit = (e: any) => {
    e.preventDefault();
    onFilter(text);
  };

  return (
    <form className="relative flex flex-1" onSubmit={handleSubmit}>
      <label htmlFor="q" className="sr-only">
        {t('search')}
      </label>
      <MagnifyingGlassIcon
        className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400"
        aria-hidden="true"
      />
      <input
        id="q"
        className="block h-full w-full border-0 py-0 pl-8 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-md"
        placeholder={t('search')}
        type="search"
        name="q"
        onChange={(e) => setText(e.target.value)}
      />
    </form>
  );
};

type FlagProps = {
  country: string;
  isoCode: string;
  size?: number;
};

const Flag = ({ country, isoCode, size = 12 }: FlagProps) => {
  if (!isoCode) return <div className={`h-${size} w-${size} flex-none bg-white`} />
  return <Image className={`h-${size} w-${size} flex-none bg-white`} fallbackSrc='https://cdn.ipregistry.co/flags/twemoji/gb.svg'
    src={`https://cdn.ipregistry.co/flags/twemoji/${isoCode.toLowerCase()}.svg`} alt={country} />
};

const Country = ((country: Country) => (
  <>
    <Flag country={country.name} isoCode={country.isoCode} />
    <div className="min-w-0 flex-auto">
      <p className="text-md font-medium pt-3 leading-6 text-gray-900">
        {country.name}
      </p>
    </div>
  </>
));

const Context = (country: Country) => {
  if (!country.isoCode) return;
  return (
    <>
      <div className="hidden sm:flex sm:flex-col sm:items-end">
        {country.regionCount} {pluralize('region', country.regionCount)}
      </div>
      <ChevronRightIcon className="h-5 w-5 flex-none text-gray-400" aria-hidden="true" />
    </>
  );
};

export const CountriesSearch = ({ onSelect }: { onSelect: Function }) => {
  const fetcher = useFetcher();

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data == null) {
      fetcher.load('/holidays?index&limit=300');
    }
  }, [fetcher]);

  const Search = ({ data }: { data: Array<Country> }) => {
    const [ offset, setOffset ] = useState(0);
    const [ filteredCountries, setFilteredCountries ] = useState(data);
    const [ countries, setCountries ] = useState(data.slice(0, LIMIT));

    const ensureSize = (items: Array<Country>) => {
      const EMPTY = { name: '', isoCode: '', regionCount: undefined, parent: '', createdAt: new Date() };
      
      if (items.length < LIMIT) {
        const empty = [...Array(LIMIT - items.length).keys()].map(_ => EMPTY);
        return [ ...items, ...empty ];
      }
      console.log(items.length);
      return items;
    };

    const handleFilter = (text: string) => {
      const filtered = !text.length ? data : data
        .filter(c => c.name.toLowerCase().startsWith(text.toLowerCase()) || 
                     c.isoCode.toLowerCase() === text.toLowerCase());
      setFilteredCountries(filtered);
      const paged = filtered.slice(offset, offset + LIMIT);
      setOffset(0);
      setCountries(ensureSize(paged));
    };

    const handlePage = (offset: number) => {
      const paged = filteredCountries.slice(offset, offset + LIMIT);
      setOffset(offset);
      setCountries(ensureSize(paged));
    };
    
    return (
      <>
        <Filter onFilter={handleFilter} />
        <div className="mt-3">
          <List data={countries} idKey="isoCode" renderItem={Country} renderContext={Context} onClick={onSelect} />
        </div>
        <Pagination onPage={handlePage}
          entity="country" offset={offset} limit={LIMIT} 
          totalItems={filteredCountries.length} />
      </>
    );
  };

  return fetcher.data && <Search data={fetcher.data.countries} />;
};

export const CountriesModal = ({ modal, onSelect }: { modal: RefObject<RefModal>, onSelect: Function }) => {
  const select = (country: Country) => {
    onSelect(country);
    modal.current?.hide();
  };

  return (
    <Modal ref={modal}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <CountriesSearch onSelect={select} />
      </div>
    </Modal>
  );
};
