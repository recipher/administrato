import type * as s from 'zapatos/schema';
import * as db from 'zapatos/db';
import pool from '../db.server';

export { default as create } from '../id.server';
import { default as create  } from '../id.server';

import { TxOrPool, type IdProp } from '../types';
import { type User } from '../access/users.server';

import PeopleService from './people.server';

export type Dependent = s.people.Selectable & { relationship: string };

const Service = (u: User) => {
  const addDependent = ({ dependent, personId, relationship }: { dependent: s.people.Insertable, personId: string, relationship: string }, txOrPool: TxOrPool = pool) => {
    return db.serializable(txOrPool, async tx => {
      const { id: dependentId, ...inserted } = await PeopleService(u).addDependent(dependent, tx);
      await db.insert('dependents', create({ dependentId, personId, relationship })).run(tx);
    
      return { ...inserted };
    });
  };

  const updateDependent = (contact: s.contacts.Updatable, txOrPool: TxOrPool = pool) => {
    return db.update('contacts', contact, { id: contact.id as string }).run(txOrPool);
  };
  const deleteDependent = ({ id }: IdProp, txOrPool: TxOrPool = pool) => {
    return db.deletes('contacts', { id }).run(txOrPool);
  };

  const listDependentsByPersonId = ({ personId }: { personId: string }, txOrPool: TxOrPool = pool) => {
    return db.select('dependents', { personId }).run(txOrPool);
  };

  return {
    addDependent,
    updateDependent,
    deleteDependent,
    listDependentsByPersonId,
  }
};

export default Service;
