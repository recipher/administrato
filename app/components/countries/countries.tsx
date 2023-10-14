import { useEffect, RefObject, useState } from 'react';
import { useFetcher } from '@remix-run/react'
import { type Country } from '~/services/countries.server';
import Modal, { type RefModal } from '~/components/modals/modal';
import { List } from '~/components/list';

import { ArrowLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';

import Pagination from '../pagination';
import Filter from '../filter';
import { Flag } from './flag';

import pluralize from '~/helpers/pluralize';

const LIMIT = 6;

const Country = ((country: Country) => (
  <>
    {!country.parent && <Flag country={country.name} isoCode={country.isoCode} />}
    <div className="min-w-0 h-12 flex-auto">
      <p className="text-md font-medium pt-3 leading-6 text-gray-900">
        {country.name}
      </p>
    </div>
  </>
));

type SearchProps = { 
  onSelect: Function; 
  onSelectRegion: Function;
  onBack: Function;
  country?: Country | undefined; 
  showRegions: boolean;
};

export const CountriesSearch = ({ onSelect, onSelectRegion, onBack, country, showRegions }: SearchProps) => {
  const fetcher = useFetcher();
  const title = country ? `Search regions of ${country.name}` : "Search countries";
  const entity = country ? "region" : "country";
  const url = country === undefined
    ? '/holidays/?index&limit=300'
    : `/holidays/${country.isoCode}/regions`;

  useEffect(() => {
    if (fetcher.state === "idle") fetcher.load(url);
  }, [country]);

  const Search = ({ data }: { data: Array<Country> }) => {
    const [ offset, setOffset ] = useState(0);
    const [ filteredCountries, setFilteredCountries ] = useState(data);
    const [ countries, setCountries ] = useState(data.slice(0, LIMIT));

    const ensureSize = (items: Array<Country> = []) => {
      const EMPTY = { name: '', isoCode: '', regionCount: undefined, parent: '', diallingCode: '', createdAt: new Date() };
      
      if (items.length < LIMIT) {
        const empty = [...Array(LIMIT - items.length).keys()].map(_ => EMPTY);
        return [ ...items, ...empty ];
      }
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
      
    const Context = (country: Country) => {
      if (!country.isoCode) return;

      const handleClick = (e: any) => {
        e.stopPropagation(); 
        onSelectRegion(country)
      };

      return (
        <>
          {!country.parent && showRegions &&
            <button onClick={handleClick}
              className="hidden sm:flex sm:flex-col sm:items-end">
              {country.regionCount} {pluralize('region', country.regionCount)}
            </button>}
          <ChevronRightIcon className="h-5 w-5 flex-none text-gray-400" aria-hidden="true" />
        </>
      );
    };

    return (
      <>
        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          <Filter onFilter={handleFilter} title={title} />
          {country && 
            <button className="text-md text-gray-400 hover:text-gray-700" 
              onClick={() => onBack() }>
            <ArrowLeftIcon className="inline -ml-0.5 mr-1 h-4 w-4" />
            <span className="mt-4">back</span>
          </button>}
        </div>

        <div className="mt-3">
          <List data={countries} idKey="isoCode" renderItem={Country} renderContext={Context} onClick={onSelect} />
        </div>
        <Pagination onPage={handlePage}
          entity={entity} offset={offset} limit={LIMIT} 
          totalItems={filteredCountries.length} />
      </>
    );
  };

  return fetcher.data && <Search data={fetcher.data.countries} />;
};

type CountryProps = { 
  modal: RefObject<RefModal>, 
  onSelect: Function, 
  onSelectRegion?: Function, 
  country?: Country | undefined 
};

export const CountriesModal = ({ modal, onSelect, onSelectRegion, country }: CountryProps) => {
  const handleSelect = (country: Country) => {
    onSelect(country);
    modal.current?.hide();
  };

  const handleSelectRegion = (country: Country) => {
    if (country?.regionCount && country.regionCount > 0 && onSelectRegion !== undefined) 
      onSelectRegion(country);
    else
      handleSelect(country);
  };

  const handleBack = () => {
    if (onSelectRegion !== undefined) onSelectRegion();
  };

  return (
    <Modal ref={modal}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 min-h-[27rem]">
        <CountriesSearch onSelect={handleSelect} onBack={handleBack}
          onSelectRegion={handleSelectRegion} country={country} showRegions={onSelectRegion !== undefined} />
      </div>
    </Modal>
  );
};
