import type * as s from 'zapatos/schema';
import * as db from 'zapatos/db';
import pool from '../db.server';

export { default as create } from '../id.server';

import { TxOrPool, type IdProp } from '../types';
import { type User } from '../access/users.server';

export type BankAccount = s.bankAccounts.Selectable;

const Service = (u: User) => {
  const addBankAccount = (contact: s.bankAccounts.Insertable, txOrPool: TxOrPool = pool) => {
    return db.insert('bankAccounts', contact).run(txOrPool);
  };

  const updateBankAccount = (contact: s.bankAccounts.Updatable, txOrPool: TxOrPool = pool) => {
    return db.update('bankAccounts', contact, { id: contact.id as string }).run(txOrPool);
  };

  const getBankAccount = ({ id }: IdProp, txOrPool: TxOrPool = pool) => {
    return db.selectExactlyOne('bankAccounts', { id }).run(txOrPool);
  };

  const deleteBankAccount = ({ id }: IdProp, txOrPool: TxOrPool = pool) => {
    return db.update('bankAccounts', { isArchived: true }, { id }).run(txOrPool);
  };

  const listBankAccountsByEntityId = ({ entityId }: { entityId: string }, txOrPool: TxOrPool = pool) => {
    return db.select('bankAccounts', { entityId, isArchived: false }).run(txOrPool);
  };

  return {
    addBankAccount,
    updateBankAccount,
    deleteBankAccount,
    getBankAccount,
    listBankAccountsByEntityId,
  }
};

export default Service;
