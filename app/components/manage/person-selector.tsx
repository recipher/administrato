import { forwardRef, Ref, useRef, useState, useImperativeHandle, useEffect, Fragment } from "react";
import { useFetcher } from "@remix-run/react";

import { useTranslation } from "react-i18next";
import { Menu, Transition } from "@headlessui/react";

import { type Person } from '~/services/manage/people.server';
import { Classifier } from '~/services/manage/';

import Modal, { RefModal } from "../modals/modal";
import Filter from "../filter";
import Pagination from "../pagination";
import { List, ListItem, ListContext } from "../list";

import { classnames, pluralize } from "~/helpers";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

const LIMIT = 6;

export interface RefSelectorModal {
  show: (type: string) => void;
};

const Dropdown = ({ onSelect, classifier }: { onSelect: Function, classifier: string }) => {
  const { t } = useTranslation();
  const items = Object.values(Classifier).filter(item => isNaN(Number(item))).map(classifier => (
    { name: classifier, onClick: () => onSelect(classifier) }
  ));

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="-m-1.5 flex items-center p-1.5 focus:outline-none">
        <span className="hidden lg:flex lg:items-center">
          <ChevronDownIcon className="ml-2 h-5 w-5 text-gray-400" aria-hidden="true" />
        </span>
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-50 mt-2.5 min-w-max origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
          {items.map((item, index) => (
            <Menu.Item key={index}>
              {({ active }) => (
                <div onClick={item.onClick} className={classnames(
                  active ? 'bg-gray-100' : '',
                  item.name === classifier ? 'font-medium text-gray-900' : 'text-gray-500',
                  'block pl-3 pr-6 py-1 text-sm leading-6 cursor-pointer')}>
                  {t(pluralize(item.name))}
                </div>
              )}
            </Menu.Item>
          ))}
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

type SelectorProps = { 
  classifier: string;
  onSelect: Function; 
  onChange: Function; 
  allowChange: boolean;
};

export const Selector = ({ classifier, onSelect, onChange, allowChange }: SelectorProps) => {
  const { t } = useTranslation();
  const fetcher = useFetcher();

  useEffect(() => {
    if (fetcher.state === "idle") 
      fetcher.load(`/manage/people/${classifier}?index`);
  }, [classifier]);

  const Select = ({ classifier, data }: { classifier: string, data: Array<any> }) => {
    const [ offset, setOffset ] = useState(0);
    const [ filteredPeople, setFilteredPeople ] = useState(data);

    const ensureSize = (items: Array<any> = []) => {
      if (items.length < LIMIT) {
        const empty = [...Array(LIMIT - items.length).keys()].map(_ => ({ id: null, name: "" }));
        return [ ...items, ...empty ];
      }
      return items;
    };

    const [ people, setPeople] = useState(ensureSize(data?.slice(0, LIMIT)));

    const handleFilter = (text: string) => {
      const filtered = !text.length ? data : data
        .filter(c => c.name.toLowerCase().startsWith(text.toLowerCase()));
      setFilteredPeople(filtered);
      const paged = filtered.slice(offset, offset + LIMIT);
      setOffset(0);
      setPeople(ensureSize(paged));
    };

    const handlePage = (offset: number) => {
      const paged = filteredPeople.slice(offset, offset + LIMIT);
      setOffset(offset);
      setPeople(ensureSize(paged));
    };
    
    const Item = (person: Person) => <ListItem className="h-6" data={person.name} />;
    const Context = (person: Person) => <ListContext select={false} />;

    return (
      <>
        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          <Filter entity={classifier} onFilter={handleFilter} />
          {allowChange && <Dropdown onSelect={onChange} classifier={classifier} />}
        </div>
        <div className="mt-3">
          <List data={people} renderItem={Item} renderContext={Context} onClick={onSelect} />
        </div>
        {/* @ts-ignore */}
        <Pagination entity={classifier}
          offset={offset} limit={LIMIT} onPage={handlePage}
          totalItems={filteredPeople?.length || 0} />
      </>
    );
  };

  return fetcher.data && <Select classifier={classifier} data={fetcher.data?.people} />;
};

export const SelectorModal = forwardRef(({ onSelect, allowChange = true }: { onSelect: any, allowChange?: boolean }, ref: Ref<RefSelectorModal>) => {
  const modal = useRef<RefModal>(null);
  const [classifier, setClassifier] = useState('');
  
  const handleSelect = (item: any) => {
    onSelect(item, classifier);
    modal.current?.hide();
  };

  const handleChange = (classifier: string) => {
    setClassifier(classifier);
  };

  const show = (classifier: string) => {
    handleChange(classifier);
    modal.current?.show();
  };

  useImperativeHandle(ref, () => ({ show }));

  return (
    <Modal ref={modal}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 min-h-[25rem]">
        <Selector classifier={classifier} onSelect={handleSelect} 
            onChange={handleChange} allowChange={allowChange} />
      </div>
    </Modal>
  );
});
