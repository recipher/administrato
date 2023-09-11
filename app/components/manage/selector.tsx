import { forwardRef, Ref, useRef, useState, useImperativeHandle, useEffect } from "react";
import { useFetcher } from "@remix-run/react";

import { WalletIcon, PaperClipIcon, IdentificationIcon, ReceiptPercentIcon } from "@heroicons/react/24/outline";

import Modal, { RefModal } from "../modals/modal";
import Filter from "../filter";
import Pagination from "../pagination";
import List from "../list/basic";

import pluralize from "~/helpers/pluralize";

const LIMIT = 6;

export interface RefSelectorModal {
  show: (type: string) => void;
};

export const entities = new Map<string, any>([
  [ "service-centre", { Icon: PaperClipIcon, dataProperty: "serviceCentres" }],
  [ "legal-entity", { Icon: WalletIcon, dataProperty: "legalEntities" }],
  [ "client", { Icon: IdentificationIcon, dataProperty: "clients" }],
  [ "provider", { Icon: ReceiptPercentIcon, dataProperty: "providers" }],
]);

export const Selector = ({ entity, onSelect }: { entity: string, onSelect: Function }) => {
  const fetcher = useFetcher();

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data == null) {
      fetcher.load(`/manage/${pluralize(entity)}?index`);
    }
  }, [fetcher]);

  const Select = ({ entity, data }: { entity: string, data: Array<any> }) => {
    const [ offset, setOffset ] = useState(0);
    const [ filteredEntities, setFilteredEntities ] = useState(data);
    const [ entities, setEntities] = useState(data.slice(0, LIMIT));

    const ensureSize = (items: Array<any>) => {
      if (items.length < LIMIT) {
        const empty = [...Array(LIMIT - items.length).keys()].map(_ => ({ id: '', name: '' }));
        return [ ...items, ...empty ];
      }
      return items;
    };

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
        <Filter entity={entity} onFilter={handleFilter} />
        <div className="mt-3">
          <List data={entities} onClick={onSelect} />
        </div>
        <Pagination onPage={handlePage}
          entity={entity} offset={offset} limit={LIMIT} 
          totalItems={filteredEntities.length} />
      </>
    );
  };

  type ObjectKey = keyof typeof entities;
  const key = entities.get(entity).dataProperty as ObjectKey;

  return fetcher.data && <Select entity={entity} data={fetcher.data[key]} />;
};

export const SelectorModal = forwardRef(({ onSelect }: { onSelect: any }, ref: Ref<RefSelectorModal>) => {
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
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Selector entity={entity} onSelect={handleSelect} />
      </div>
    </Modal>
  );
});
