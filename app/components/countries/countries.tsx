import { useEffect, RefObject } from 'react';
import { useFetcher } from '@remix-run/react'
import { type Country } from '~/models/countries.server';
import Modal, { RefModal } from '~/components/modals/modal';
import { Basic as List } from '~/components/list';

export const CountriesSearch = ({ onSelect }: { onSelect: Function }) => {
  const fetcher = useFetcher();

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data == null) {
      fetcher.load('/holidays?index&limit=10');
    }
  }, [fetcher]);

  return (
    <>
      {fetcher.data && <List data={fetcher.data.countries} onClick={onSelect} />}
    </>
  );
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
