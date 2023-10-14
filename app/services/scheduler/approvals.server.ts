import type * as s from 'zapatos/schema';
import * as db from 'zapatos/db';
import pool from '../db.server';

import { IdProp, TxOrPool } from '../types';

export { default as create } from '../id.server';

import { type User } from '../access/users.server';

export type Approver = s.approvers.Selectable;
export type Approval = s.approvals.Selectable;

const Service = (u: User) => {

  const addApprover = async (approver: s.approvers.Insertable, txOrPool: TxOrPool = pool) => {
    return db.upsert('approvers', approver, [ "entityId", "userId" ]).run(txOrPool);
  };

  const addApprovers = async (approvers: s.approvers.Insertable[], txOrPool: TxOrPool = pool) => {
    return db.upsert('approvers', approvers, [ "entityId", "userId" ]).run(txOrPool);
  };

  const addApproval = async (approval: s.approvals.Insertable, txOrPool: TxOrPool = pool) => {
    return db.upsert('approvals', approval, [ "entityId", "userId" ]).run(txOrPool);
  };

  const addApprovals = async (approvals: s.approvals.Insertable[], txOrPool: TxOrPool = pool) => {
    return db.upsert('approvals', approvals, [ "entityId", "userId" ]).run(txOrPool);
  };

  const removeApprover = async ({ id }: IdProp, txOrPool: TxOrPool = pool) => {
    return db.deletes('approvers', { id }).run(txOrPool);
  };

  const removeApproval = async ({ id }: IdProp, txOrPool: TxOrPool = pool) => {
    return db.deletes('approvals', { id }).run(txOrPool);
  };

  const listApproversByEntityId = async ({ entityId }: { entityId: string }, txOrPool: TxOrPool = pool) => {
    return db.select('approvers', { entityId }).run(txOrPool);
  };

  const listApprovalsByEntityId = async ({ entityId }: { entityId: string }, txOrPool: TxOrPool = pool) => {
    return db.sql<s.approvals.SQL, s.approvals.Selectable[]>`
      SELECT * FROM ${'approvals'} 
      WHERE ${db.param(entityId)} = ANY(${'entityId'})`
    .run(txOrPool);
  };
  
  const listApproversBySetId = async ({ setId }: { setId: string }, txOrPool: TxOrPool = pool) => {
    const approvals = await db.sql<s.approvals.SQL, s.approvals.Selectable[]>`
      SELECT ${'userId'} AS id, ${'userId'}, ${'userData'}, ${'isOptional'} 
      FROM ${'approvals'} 
      WHERE ${db.param(setId)} = ${'setId'}`
    .run(txOrPool);

    return approvals.reduce((approvals: Array<Approval>, approval ) =>
      approvals.find(a => a.userId === approval.userId) ? approvals : [ ...approvals, approval ]
    , []);
  };

  const removeApproverFromSet = async ({ setId, userId }: { setId: string, userId: string }, txOrPool: TxOrPool = pool) => {

  };

  const addApproverToSet = async ({ setId, userId, userData }: { setId: string, userId: string, userData: any }, txOrPool: TxOrPool = pool) => {

  };

  return {
    addApprover,
    addApprovers,
    addApproval,
    addApprovals,
    removeApprover,
    removeApproval,
    removeApproverFromSet,
    addApproverToSet,
    listApproversByEntityId,
    listApproversBySetId,
    listApprovalsByEntityId,
  };
};

export default Service;