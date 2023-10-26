import type * as s from 'zapatos/schema';
import * as db from 'zapatos/db';
import pool from '../db.server';
import AddressConfigurator from '@recipher/i18n-postal-address';

export { default as create } from '../id.server';

import { TxOrPool, type IdProp } from '../types';
import { type User } from '../access/users.server';
import { AddressFields } from './';

export type Address = s.addresses.Selectable & { address?: string };

const Service = (u: User) => {

  const withAddress = (address: Address) => {
    type AddressKey = keyof Address;
    const config = new AddressConfigurator();
    
    AddressFields.forEach((field: string) => {
      const fieldKey = field as AddressKey;
      if (address[fieldKey]) config.setProperty(field, address[fieldKey] as string);
    });

    config.setFormat({ country: address.countryIsoCode as string });
    return { ...address, address: config.toString() };
  };

  const addAddress = (address: s.addresses.Insertable, txOrPool: TxOrPool = pool) => {
    return db.insert('addresses', address).run(txOrPool);
  };

  const getAddress = async ({ id }: IdProp, txOrPool: TxOrPool = pool) => {
    const [ address ] = await db.sql<s.addresses.SQL, s.addresses.Selectable[]>`
      SELECT * FROM ${'addresses'} WHERE ${{id}}}
    `.run(txOrPool);
    return withAddress(address);
  };

  const deleteAddress = ({ id }: IdProp, txOrPool: TxOrPool = pool) => {
    return db.deletes('addresses', { id }).run(txOrPool);
  };

  const listAddressesByEntityId = async ({ entityId }: { entityId: string }, txOrPool: TxOrPool = pool) => {
    const addresses = await db.sql<s.addresses.SQL, s.addresses.Selectable[]>`
      SELECT * FROM ${'addresses'} WHERE ${{entityId}}
    `.run(txOrPool);
    return addresses.map(withAddress);
  };

  return {
    addAddress,
    deleteAddress,
    getAddress,
    listAddressesByEntityId,
  }
};

export default Service;
