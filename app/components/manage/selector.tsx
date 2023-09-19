import { forwardRef, Ref, useRef, useState, useImperativeHandle, useEffect, Fragment } from "react";
import { useFetcher } from "@remix-run/react";

import { useTranslation } from "react-i18next";

import { MapIcon, WalletIcon, CurrencyYenIcon, IdentificationIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

import Modal, { RefModal } from "../modals/modal";
import Filter from "../filter";
import Pagination from "../pagination";
import List from "../list/basic";

import pluralize from "~/helpers/pluralize";
import { Menu, Transition } from "@headlessui/react";
import classnames from "~/helpers/classnames";

const LIMIT = 6;

export interface RefSelectorModal {
  show: (type: string) => void;
};

export const entities = new Map<string, any>([
  [ "service-centre", { Icon: MapIcon, dataProperty: "serviceCentres" }],
  [ "legal-entity", { Icon: WalletIcon, dataProperty: "legalEntities" }],
  [ "client", { Icon: IdentificationIcon, dataProperty: "clients" }],
  [ "provider", { Icon: CurrencyYenIcon, dataProperty: "providers" }],
]);

const Dropdown = ({ onSelect, entity }: { onSelect: Function, entity: string }) => {
  const { t } = useTranslation();
  
  const items = Array.from(entities.keys()).map(entity => (
    { name: entity, onClick: () => onSelect(entity) }
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
                  item.name === entity ? 'font-medium text-gray-900' : 'text-gray-500',
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

export const Selector = ({ entity, onSelect, onChange, allowChange }: 
  { entity: string, onSelect: Function, onChange: Function, allowChange: boolean }) => {
  const fetcher = useFetcher();

  useEffect(() => {
    if (fetcher.state === "idle")
      fetcher.load(`/manage/${pluralize(entity)}?index&full=true`);
  }, [entity]);

  const Select = ({ entity, data }: { entity: string, data: Array<any> }) => {
    const [ offset, setOffset ] = useState(0);
    const [ filteredEntities, setFilteredEntities ] = useState(data);

    const ensureSize = (items: Array<any> = []) => {
      if (items.length < LIMIT) {
        const empty = [...Array(LIMIT - items.length).keys()].map(_ => ({ id: '', name: '' }));
        return [ ...items, ...empty ];
      }
      return items;
    };

    const [ entities, setEntities] = useState(ensureSize(data?.slice(0, LIMIT)));

    const handleFilter = (text: string) => {
      const filtered = !text.length ? data : data
        .filter(c => c.name.toLowerCase().startsWith(text.toLowerCase()));
      setFilteredEntities(filtered);
      const paged = filtered.slice(offset, offset + LIMIT);
      setOffset(0);
      setEntities(ensureSize(paged));
    };

    const handlePage = (offset: number) => {
      const paged = filteredEntities.slice(offset, offset + LIMIT);
      setOffset(offset);
      setEntities(ensureSize(paged));
    };
    
    return (
      <>
        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          <Filter entity={entity} onFilter={handleFilter} />
          {allowChange && <Dropdown onSelect={onChange} entity={entity} />}
        </div>
        <div className="mt-3">
          <List data={entities} onClick={onSelect} />
        </div>
        <Pagination onPage={handlePage}
          entity={entity} offset={offset} limit={LIMIT} 
          totalItems={filteredEntities?.length || 0} />
      </>
    );
  };

  type ObjectKey = keyof typeof entities;
  const key = entities.get(entity).dataProperty as ObjectKey;

  return fetcher.data && <Select entity={entity} data={fetcher.data?.[key]} />;
};

export const SelectorModal = forwardRef(({ onSelect, allowChange = true }: 
  { onSelect: any, allowChange?: boolean }, ref: Ref<RefSelectorModal>) => {
  const modal = useRef<RefModal>(null);
  const [entity, setEntity] = useState('');

  const handleSelect = (item: any) => {
    onSelect(entity, item);
    modal.current?.hide();
  };

  const show = (entity: string) => {
    setEntity(entity);
    modal.current?.show();
  };

  useImperativeHandle(ref, () => ({ show }));

  return (
    <Modal ref={modal}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 min-h-[27rem]">
        <Selector entity={entity} onSelect={handleSelect} onChange={setEntity} allowChange={allowChange} />
      </div>
    </Modal>
  );
});
