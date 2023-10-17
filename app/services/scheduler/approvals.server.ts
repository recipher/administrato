import type * as s from 'zapatos/schema';
import * as db from 'zapatos/db';
import pool from '../db.server';

import { IdProp, TxOrPool } from '../types';

import { default as create } from '../id.server';
export { default as create } from '../id.server';

import { type User } from '../access/users.server';

import SchedulesService from './schedules.server';

export enum Status {
  Draft = 'draft',
  Approved = 'approved',
  Rejected = 'rejected',
  Broken = 'broken',
};

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
    return db.upsert('approvals', 
      ({ ...approval, notes: db.param([], true) }), 
      [ "entityId", "userId" ])
    .run(txOrPool);
  };

  const addApprovals = async (approvals: s.approvals.Insertable[], txOrPool: TxOrPool = pool) => {
    return db.upsert('approvals', approvals.map(approval => 
      ({ ...approval, notes: db.param([], true) })), 
      [ "entityId", "userId" ])
    .run(txOrPool);
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

  const listApprovalsByEntityIdAndStatus = async ({ entityId, userId, status, notStatus }: { entityId: string, userId?: string | undefined, status?: string | undefined, notStatus?: string | undefined }, txOrPool: TxOrPool = pool) => {
    const userQuery = userId === undefined ? db.sql`${'userId'} IS NOT NULL`
      : db.sql`${{userId}}`;
    
    const statusQuery = status === undefined && notStatus === undefined
      ? db.sql`${'status'} IS NOT NULL`
      : status !== undefined
        ? db.sql`${{status}}` 
        : db.sql`${'status'} != ${db.param(status)}`;

    return db.sql<s.approvals.SQL, s.approvals.Selectable[]>`
      SELECT * FROM ${'approvals'} 
      WHERE
        ${db.param(entityId)} = ANY(${'entityId'}) AND
        ${userQuery} AND
        ${statusQuery}
    `.run(txOrPool);
  };


  const listApprovalsByEntityId = async ({ entityId, userId, status }: { entityId: string, userId?: string, status?: string }, txOrPool: TxOrPool = pool) => {
    return listApprovalsByEntityIdAndStatus({ entityId, userId, status }, txOrPool);
  };

  const listApprovalsByEntityIdAndNotStatus = async ({ entityId, userId, status }: { entityId: string, userId?: string, status?: string }, txOrPool: TxOrPool = pool) => {
    return listApprovalsByEntityIdAndStatus({ entityId, userId, notStatus: status }, txOrPool);
  };
  
  const listApproversBySetId = async ({ setId }: { setId: string }, txOrPool: TxOrPool = pool) => {
    const approvals = await db.sql<s.approvals.SQL, s.approvals.Selectable[]>`
      SELECT ${'userId'} AS id, ${'userId'}, ${'userData'}, ${'isOptional'} 
      FROM ${'approvals'} 
      WHERE 
        ${db.param(setId)} = ${'setId'} AND
        ${'userId'} IS NOT NULL
    `.run(txOrPool);

    return approvals.reduce((approvals: Array<Approval>, approval ) =>
      approvals.find(a => a.userId === approval.userId) ? approvals : [ ...approvals, approval ]
    , []);
  };

  const removeApproverFromSet = async ({ setId, userId }: { setId: string, userId: string }, txOrPool: TxOrPool = pool) => {
    return db.deletes('approvals', { setId, userId }).run(txOrPool);
  };

  const addApproverToSet = async ({ setId, userId, userData }: { setId: string, userId: string, userData: any }, txOrPool: TxOrPool = pool) => {
    return db.serializable(txOrPool, async tx => {
      const approvals = await db.select('approvals', { setId }).run(tx);

      return Promise.all(approvals.map(async ({ entity, entityId, status }: Approval) => {
        return db.upsert('approvals', 
          create({ entity, entityId, setId, userId, userData, status, notes: db.param([], true) }), 
          [ "entityId", "userId" ])
        .run(tx);
      }));
    });
  };

  const changeStatus = async ({ schedules, notes, status }: { schedules: Array<string>, notes: string, status: Status }, txOrPool: TxOrPool = pool) => {
    return db.serializable(txOrPool, async tx => {
      return Promise.all(schedules.map(async scheduleId => {
        const approvals = await listApprovalsByEntityId({ entityId: scheduleId, userId: u.id }, tx);
        
        await Promise.all(approvals.map(async ({ id, notes: existing }) => {
          if (existing === null) existing = [];
          return db.update('approvals', { status, notes: db.param([ ...(existing as Array<any>), { user: u.id, notes } ], true) }, { id }).run(tx);
        }));

        const draft = await listApprovalsByEntityIdAndNotStatus({ entityId: scheduleId, status }, tx);

        if (draft.length === 0) {
          const { version } = await SchedulesService(u).getScheduleByIdentity({ id: scheduleId }, tx);
          return db.update('schedules', { status, version: version+1 }, { id: scheduleId }).run(tx);
        }
      }));
    });
  };

  const approve = async (params: { schedules: Array<string>, notes: string }, txOrPool: TxOrPool = pool) => {
    return changeStatus({ ...params, status: Status.Approved }, txOrPool);
  };

  const unapprove = async (params: { schedules: Array<string>, notes: string }, txOrPool: TxOrPool = pool) => {
    return changeStatus({ ...params, status: Status.Draft }, txOrPool);
  };

  const reject = async (params: { schedules: Array<string>, notes: string }, txOrPool: TxOrPool = pool) => {
    return changeStatus({ ...params, status: Status.Rejected }, txOrPool);
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
    approve,
    unapprove,
    reject,
    listApproversByEntityId,
    listApproversBySetId,
    listApprovalsByEntityId,
  };
};

export default Service;