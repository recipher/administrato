import type * as s from 'zapatos/schema';
import * as db from 'zapatos/db';
import pool from '../db.server';

export { default as create } from '../id.server';

import { TxOrPool, type IdProp } from '../types';
import { type User } from '../access/users.server';

export type Contact = s.contacts.Selectable;

const Service = (u: User) => {
  const addSalary = (salary: s.salaries.Insertable, txOrPool: TxOrPool = pool) => {
    return db.insert('salaries', { ...salary, createdBy: u }).run(txOrPool);
  };

  const endSalary = ({ id, endOn = new Date() }: IdProp & { endOn?: Date }, txOrPool: TxOrPool = pool) => {
    return db.update('salaries', { endOn, updatedBy: u }, { id }).run(txOrPool);
  };

  const listSalariesByPersonId = ({ personId }: { personId: string }, txOrPool: TxOrPool = pool) => {
    return db.select('salaries', { personId }).run(txOrPool);
  };

  return {
    addSalary,
    endSalary,
    listSalariesByPersonId,
  }
};

export default Service;
