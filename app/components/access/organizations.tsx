import { useEffect, RefObject, useState } from 'react';
import { useFetcher } from '@remix-run/react'
import Modal, { type RefModal } from '~/components/modals/modal';
import { Basic as List } from '~/components/list';
import Pagination from '../pagination';
import Filter from '../filter';
import { Organization } from '~/auth/auth.server';

const LIMIT = 6;

export const OrganizationsSearch = ({ onSelect }: { onSelect: Function }) => {
  const fetcher = useFetcher();

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data == null) {
      fetcher.load('/access/organizations?index&limit=300');
    }
  }, [fetcher]);

  const Search = ({ data }: { data: Array<Organization> }) => {
    const [ offset, setOffset ] = useState(0);
    const [ filteredOrgs, setFilteredOrgs ] = useState(data);

    const ensureSize = (items: Array<any>) => {
      const EMPTY = { displayName: '', id: '' };
      
      if (items.length < LIMIT) {
        const empty = [...Array(LIMIT - items.length).keys()].map(_ => EMPTY);
        return [ ...items, ...empty ];
      }
      return items;
    };

    const [ orgs, setOrgs ] = useState(ensureSize(data.slice(0, LIMIT)));

    const handleFilter = (text: string) => {
      const filtered = !text.length ? data : data
        .filter(o => o.name.toLowerCase().startsWith(text.toLowerCase()));
      setFilteredOrgs(filtered);
      const paged = filtered.slice(offset, offset + LIMIT);
      setOffset(0);
      setOrgs(ensureSize(paged));
    };

    const handlePage = (offset: number) => {
      const paged = filteredOrgs.slice(offset, offset + LIMIT);
      setOffset(offset);
      setOrgs(ensureSize(paged));
    };
    
    return (
      <>
        <Filter onFilter={handleFilter} />
        <div className="mt-3">
          <List data={orgs} nameKey="displayName" onClick={onSelect} />
        </div>
        <Pagination onPage={handlePage}
          entity="organization" offset={offset} limit={LIMIT} 
          totalItems={filteredOrgs.length} />
      </>
    );
  };

  return fetcher.data && <Search data={fetcher.data.organizations} />;
};

export const SelectorModal = ({ modal, onSelect }: { modal: RefObject<RefModal>, onSelect: Function }) => {
  const handleSelect = (org: Organization) => {
    onSelect(org);
    modal.current?.hide();
  };

  return (
    <Modal ref={modal}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <OrganizationsSearch onSelect={handleSelect} />
      </div>
    </Modal>
  );
};
