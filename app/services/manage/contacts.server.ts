import type * as s from 'zapatos/schema';
import * as db from 'zapatos/db';
import pool from '../db.server';

export { default as create } from '../id.server';

import { TxOrPool, type IdProp } from '../types';
import { type User } from '../access/users.server';

export type Contact = s.contacts.Selectable;

const Service = (u: User) => {
  const addContact = (contact: s.contacts.Insertable, txOrPool: TxOrPool = pool) => {
    return db.insert('contacts', contact).run(txOrPool);
  };

  const updateContact = (contact: s.contacts.Updatable, txOrPool: TxOrPool = pool) => {
    return db.update('contacts', contact, { id: contact.id as string }).run(txOrPool);
  };

  const getContact = ({ id }: IdProp, txOrPool: TxOrPool = pool) => {
    return db.selectExactlyOne('contacts', { id }).run(txOrPool);
  };

  const deleteContact = ({ id }: IdProp, txOrPool: TxOrPool = pool) => {
    return db.deletes('contacts', { id }).run(txOrPool);
  };

  const listContactsByEntityId = ({ entityId }: { entityId: string }, txOrPool: TxOrPool = pool) => {
    return db.select('contacts', { entityId }).run(txOrPool);
  };

  return {
    addContact,
    updateContact,
    deleteContact,
    getContact,
    listContactsByEntityId,
  }
};

export default Service;
