import { useEffect, RefObject, useState } from 'react';
import { useFetcher } from '@remix-run/react'
import Modal, { type RefModal } from '~/components/modals/modal';
import { Basic as List } from '~/components/list';
import Pagination from '../pagination';
import Filter from '../filter';
import { User } from '~/auth/auth.server';

const LIMIT = 6;

export const UsersSearch = ({ onSelect }: { onSelect: Function }) => {
  const fetcher = useFetcher();

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data == null) {
      fetcher.load('/access/users?index&limit=300');
    }
  }, [fetcher]);

  const Search = ({ data }: { data: Array<User> }) => {
    const [ offset, setOffset ] = useState(0);
    const [ filteredUsers, setFilteredUsers ] = useState(data);

    const ensureSize = (items: Array<User>) => {
      const EMPTY = { name: '', id: '' };
      
      if (items.length < LIMIT) {
        const empty = [...Array(LIMIT - items.length).keys()].map(_ => EMPTY);
        return [ ...items, ...empty ];
      }
      return items;
    };

    const [ users, setUsers ] = useState(ensureSize(data.slice(0, LIMIT)));

    const handleFilter = (text: string) => {
      const filtered = !text.length ? data : data
        .filter(o => o.name.toLowerCase().startsWith(text.toLowerCase()));
      setFilteredUsers(filtered);
      const paged = filtered.slice(offset, offset + LIMIT);
      setOffset(0);
      setUsers(ensureSize(paged));
    };

    const handlePage = (offset: number) => {
      const paged = filteredUsers.slice(offset, offset + LIMIT);
      setOffset(offset);
      setUsers(ensureSize(paged));
    };
    
    return (
      <>
        <Filter onFilter={handleFilter} />
        <div className="mt-3">
          <List data={users} nameKey="name" onClick={onSelect} />
        </div>
        <Pagination onPage={handlePage}
          entity="user" offset={offset} limit={LIMIT} 
          totalItems={filteredUsers.length} />
      </>
    );
  };

  return fetcher.data && <Search data={fetcher.data.users} />;
};

export const SelectorModal = ({ modal, onSelect }: { modal: RefObject<RefModal>, onSelect: Function }) => {
  const handleSelect = (user: User) => {
    onSelect(user);
    modal.current?.hide();
  };

  return (
    <Modal ref={modal}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <UsersSearch onSelect={handleSelect} />
      </div>
    </Modal>
  );
};
