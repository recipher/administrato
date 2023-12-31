import type * as s from 'zapatos/schema';
import * as db from 'zapatos/db';
import pool from '../db.server';
import arc from '@architect/functions';

import { IdProp, TxOrPool } from '../types';

import { default as create } from '../id.server';
export { default as create } from '../id.server';

import { type User } from '../access/users.server';
import ScheduleService from './schedules.server';
import LegalEntityService from '../manage/legal-entities.server';
import UserService from '../access/users.server';
import { mapProfileToUser, fromCookie } from '~/auth/auth.server';
import { scheduler } from '~/auth/permissions';

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
    return db.upsert('approvers', { ...approver, updatedBy: u }, [ "entityId", "userId" ]).run(txOrPool);
  };

  const addApprovers = async (approvers: s.approvers.Insertable[], txOrPool: TxOrPool = pool) => {
    return db.upsert('approvers', approvers.map(a => ({ ...a, updatedBy: u })), [ "entityId", "userId" ])
      .run(txOrPool);
  };

  const addApproval = async (approval: s.approvals.Insertable, txOrPool: TxOrPool = pool) => {
    return db.upsert('approvals', 
      ({ ...approval, notes: db.param([], true), updatedBy: u }), 
      [ "entityId", "userId" ])
    .run(txOrPool);
  };

  const addApprovals = async (approvals: s.approvals.Insertable[], txOrPool: TxOrPool = pool) => {
    return db.upsert('approvals', approvals.map(approval => 
      ({ ...approval, notes: db.param([], true), updatedBy: u })), 
      [ "entityId", "userId" ])
    .run(txOrPool);
  };

  const removeApprover = async ({ id }: IdProp, txOrPool: TxOrPool = pool) => {
    return db.deletes('approvers', { id }).run(txOrPool);
  };

  const removeApproval = async ({ id }: IdProp, txOrPool: TxOrPool = pool) => {
    return db.deletes('approvals', { id }).run(txOrPool);
  };
  
  const removeApprovalByEntityIdAndUserId = async ({ entityId, userId }: { entityId: string, userId: string }, txOrPool: TxOrPool = pool) => {
    return db.deletes('approvals', 
      db.sql<s.approvals.SQL>`${{userId}} AND ${db.param(entityId)} = ANY(${'entityId'})`
    ).run(txOrPool);  
  };

  const listApproversByEntityId = async ({ entityId }: { entityId: string }, txOrPool: TxOrPool = pool) => {
    return db.select('approvers', { entityId }).run(txOrPool);
  };

  const listApprovalsByEntityIdAndStatus = async ({ entityId, userId, status, notStatus }: { entityId: string, userId?: string | undefined, status?: Status | undefined, notStatus?: string | undefined }, txOrPool: TxOrPool = pool) => {
    const userQuery = userId === undefined ? db.sql`${'userId'} IS NOT NULL`
      : db.sql`${{userId}}`;

    const statusQuery = (status == null && notStatus === undefined)
      ? db.sql`${'approvals'}.${'status'} IS NOT NULL`
      : status !== undefined
        ? db.sql`${'approvals'}.${'status'} = ${db.param(status)}` 
        : db.sql`${'approvals'}.${'status'} != ${db.param(notStatus)}`;

    return db.sql<s.approvals.SQL | s.schedules.SQL, s.approvals.Selectable[]>`
      SELECT ${'approvals'}.*, 
        ${'schedules'}.${'id'} AS "scheduleId", ${'schedules'}.${'date'}, ${'schedules'}.${'name'}, ${'schedules'}.${'version'}
      FROM ${'approvals'} 
      INNER JOIN ${'schedules'} ON ${'schedules'}.${'id'} = ANY(${'approvals'}.${'entityId'})
      WHERE
        ${db.param(entityId)} = ANY(${'entityId'}) AND
        ${userQuery} AND
        ${statusQuery}
    `.run(txOrPool);
  };

  const listApprovalsByStatus = async ({ userId, status }: { userId?: string | undefined, status?: Status | undefined, notStatus?: string | undefined }, txOrPool: TxOrPool = pool) => {
    const userQuery = userId === undefined ? db.sql`${'userId'} IS NOT NULL`
      : db.sql`${{userId}}`;

    const statusQuery = (status == null)
      ? db.sql`${'approvals'}.${'status'} IS NOT NULL`
      : db.sql`${'approvals'}.${'status'} = ${db.param(status)}`;

    return db.sql<s.approvals.SQL | s.schedules.SQL | s.legalEntities.SQL, s.approvals.Selectable[]>`
      SELECT ${'approvals'}.*, ${'legalEntities'}.${'name'} AS "legalEntity",
        ${'schedules'}.${'id'} AS "scheduleId", ${'schedules'}.${'date'}, ${'schedules'}.${'name'}, ${'schedules'}.${'version'}, ${'schedules'}.${'legalEntityId'}
      FROM ${'approvals'} 
      INNER JOIN ${'schedules'} ON ${'schedules'}.${'id'} = ANY(${'approvals'}.${'entityId'})
      INNER JOIN ${'legalEntities'} ON ${'legalEntities'}.${'id'} = ${'schedules'}.${'legalEntityId'}
      WHERE
        ${userQuery} AND
        ${statusQuery}
      ORDER BY ${'schedules'}.${'date'} ASC
    `.run(txOrPool);
  };

  const listApprovalsByEntityId = async ({ entityId, userId, status }: { entityId: string, userId?: string, status?: Status }, txOrPool: TxOrPool = pool) => {
    return listApprovalsByEntityIdAndStatus({ entityId, userId, status }, txOrPool);
  };

  const listApprovalsByEntityIdAndNotStatus = async ({ entityId, userId, status }: { entityId: string, userId?: string, status?: Status }, txOrPool: TxOrPool = pool) => {
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

      await Promise.all(approvals.map(async ({ entity, entityId, status }: any) => {
        return db.upsert('approvals', 
          create({ entity, entityId, setId, userId, userData, status, notes: db.param([], true) }), 
          [ "entityId", "userId" ])
        .run(tx);
      }));

      arc.queues.publish({
        name: "approval-added",
        payload: { setId, userId, userData,  meta: { user: u }}
      });
    });
  };

  const changeStatus = async ({ schedules, notes, status }: { schedules: Array<string>, notes: string, status: Status }, txOrPool: TxOrPool = pool) => {
    return db.serializable(txOrPool, async tx => {
      return Promise.all(schedules.map(async scheduleId => {
        const approvals = await listApprovalsByEntityId({ entityId: scheduleId, userId: u.id }, tx);

        await Promise.all(approvals.map(async ({ id, notes: existing }) => {
          if (existing === null) existing = [];
          return db.update('approvals', 
            { status, notes: db.param([ ...(existing as Array<any>), { user: u.id, notes } ], true) }, 
            { id, userId: u.id })
          .run(tx);
        }));

        const draft = await listApprovalsByEntityIdAndNotStatus({ entityId: scheduleId, status }, tx);

        if (draft.length === 0) {
          const { version } = await ScheduleService(u).getScheduleByIdentity({ id: scheduleId }, tx);
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

  const addDefaultApprovers = async ({ entityId: id }: { entityId: string }, txOrPool: TxOrPool = pool) => {
    const { keyStart, keyEnd } = await LegalEntityService(u).getLegalEntity({ id });

    const orgKey = u.organization ? u.organization.auth0id : 'default';

    const authorizations = await db.sql<s.authorizations.SQL, s.authorizations.Selectable[]>`
      SELECT * FROM ${'authorizations'}
      WHERE ${db.param(keyStart)} >= ${'keyStart'} AND
            ${'keyEnd'} >= ${db.param(keyEnd)} AND
            ${'organization'} = ${db.param(orgKey)} AND
            (${'entity'} = 'legal-entity' OR ${'entity'} = 'security-group')`
      .run(txOrPool);

    const users = (await Promise.all(authorizations.map(async ({ user: id }) => {
      const profile = await UserService(u).getTokenizedUser({ id });
      const user = fromCookie(mapProfileToUser(id, profile) as any);

      if (user.permissions.includes(scheduler.edit.schedule)) return {
        id: user.id,
        email: user.email,
        name: user.name
      };
    })));

    const approvers = users
      .reduce((users: Array<any>, user) => 
        user === undefined || users.find(u => u.id === user.id) ? users : [ ...users, user ], [])
      .map((user: any) => (create({
        entity: 'legal-entity',
        entityId: id,
        userId: user.id,
        userData: user,
      })));
    console.log(approvers);
    return addApprovers(approvers, txOrPool);
  };

  return {
    addApprover,
    addApprovers,
    addDefaultApprovers,
    addApproval,
    addApprovals,
    removeApprover,
    removeApproval,
    removeApprovalByEntityIdAndUserId,
    removeApproverFromSet,
    addApproverToSet,
    approve,
    unapprove,
    reject,
    listApprovalsByStatus,
    listApproversByEntityId,
    listApproversBySetId,
    listApprovalsByEntityId,
  };
};

export default Service;