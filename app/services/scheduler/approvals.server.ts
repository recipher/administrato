import type * as s from 'zapatos/schema';
import * as db from 'zapatos/db';
import pool from '../db.server';

import { TxOrPool } from '../types';

export { default as create } from '../id.server';

import { type User } from '../access/users.server';

const Service = (u: User) => {

  const addApprovers = async (approvers: s.approvers.Insertable[], txOrPool: TxOrPool = pool) => {
    return db.insert('approvers', approvers).run(txOrPool);
};

  const listApproversByLegalEntity = async ({ legalEntityId }: { legalEntityId: string }, txOrPool: TxOrPool = pool) => {
    return db.select('approvers', { entityId: legalEntityId }).run(txOrPool);
  };
  
  return {
    addApprovers,
    listApproversByLegalEntity,
  };
};

export default Service;