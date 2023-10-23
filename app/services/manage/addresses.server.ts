import type * as s from 'zapatos/schema';
import * as db from 'zapatos/db';
import pool from '../db.server';
import AddressConfigurator from '@recipher/i18n-postal-address';

export { default as create } from '../id.server';

import { TxOrPool, type IdProp } from '../types';
import { type User } from '../access/users.server';

export type Address = s.addresses.Selectable & { address?: string };

const fields = [
  'address1',
  'address2',
  'addressNum',
  'city',
  'country',
  'countryIsoCode',
  'postalCode',
  'region',
  'state',
  'province',
  'prefecture',
  'republic',
  'do',
  'dong',
  'gu',
  'si',
];

const Service = (u: User) => {

  const withAddress = (address: Address) => {
    type AddressKey = keyof Address;
    const config = new AddressConfigurator();
    
    fields.forEach((field: string) => {
      const fieldKey = field as AddressKey;
      if (address[fieldKey]) config.setProperty(field, address[fieldKey] as string);
    });

    // if (address.address1) config.setAddress1(address.address1);
    // if (address.address2) config.setAddress2(address.address2);
    // if (address.addressNum) config.setAddressNum(address.addressNum);
    // if (address.city) config.setCity(address.city);
    // if (address.region) config.setRegion(address.region);
    // if (address.state) config.setState(address.state);
    // if (address.province) config.setProvince(address.province);
    // if (address.prefecture) config.setAddress2(address.prefecture);
    // if (address.republic) config.setAddress2(address.republic);
    // if (address.do) config.setDo(address.do);
    // if (address.dong) config.setDong(address.dong);
    // if (address.gu) config.setGu(address.gu);
    // if (address.si) config.setSi(address.si);
    // if (address.postalCode) config.setAddress2(address.postalCode);
    // if (address.country) config.setAddress2(address.country);
    // if (address.countryIsoCode) config.setAddress2(address.countryIsoCode);

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
