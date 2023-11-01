import type * as s from 'zapatos/schema';
import * as db from 'zapatos/db';
import pool from '../db.server';

import { getBankingConfig } from './banking';

export { default as create } from '../id.server';

import { TxOrPool, type IdProp } from '../types';
import { type User } from '../access/users.server';

export type BankAccount = s.bankAccounts.Selectable & { iban?: string };

const Service = (u: User) => {

  const withIban = (account: BankAccount) => {
    const config = getBankingConfig(account.countryIsoCode);

    return {
      ...account,
      bban: account.number,
      iban: `${account.countryIsoCode}${config?.iban.checkDigits} ${account.number}`
    }
  };

  const addBankAccount = async (account: s.bankAccounts.Insertable, txOrPool: TxOrPool = pool) => {
    return db.insert('bankAccounts', { ...account, createdBy: u }).run(txOrPool);
  };

  const updateBankAccount = async (account: s.bankAccounts.Updatable, txOrPool: TxOrPool = pool) => {
    return db.update('bankAccounts', { ...account, updatedBy: u }, { id: account.id as string }).run(txOrPool);
  };

  const getBankAccount = async ({ id }: IdProp, txOrPool: TxOrPool = pool) => {
    const [ account ] = await db.sql<s.bankAccounts.SQL, s.bankAccounts.Selectable[]>`
      SELECT * FROM ${'bankAccounts'} WHERE ${{id}}
    `.run(txOrPool);
    return withIban(account);
  };

  const deleteBankAccount = async ({ id }: IdProp, txOrPool: TxOrPool = pool) => {
    return db.update('bankAccounts', { isArchived: true, updatedBy: u }, { id }).run(txOrPool);
  };

  const listBankAccountsByEntityId = async ({ entityId }: { entityId: string }, txOrPool: TxOrPool = pool) => {
    const accounts = await db.sql<s.bankAccounts.SQL, s.bankAccounts.Selectable[]>`
      SELECT * FROM ${'bankAccounts'} WHERE ${{entityId}}
    `.run(txOrPool);
    return accounts.map(withIban);
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
