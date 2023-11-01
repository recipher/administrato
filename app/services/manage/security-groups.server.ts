import type * as s from 'zapatos/schema';
import * as db from 'zapatos/db';
import pool from '../db.server';

import { default as create } from '../id.server';
export { default as create } from '../id.server';

import type { SecurityKey, IdProp, NameProp, KeyQueryOptions as BaseKeyQueryOptions, 
  BypassKeyCheck, TxOrPool } from '../types';

import UserService, { type User } from '../access/users.server';
import toNumber from '~/helpers/to-number';

import { whereKeys, whereExactKeys, generateIdentifier } from './shared.server';

const KEY_MIN = 0; //Number.MIN_SAFE_INTEGER
const KEY_MAX = Number.MAX_SAFE_INTEGER; // 9007199254740991
const MAX_ENTITIES = 100;

type KeyQueryOptions = BaseKeyQueryOptions & {
  parentId?: string | undefined;
};

export type SecurityGroup = s.securityGroups.Selectable & { groupCount?: number };

const Service = (u: User) => {
  const getLatest = async (parentId: string | null, txOrPool: TxOrPool = pool) => {
    const whereParent = parentId
      ? db.sql`${'parentId'} = ${db.param(parentId)}`
      : db.sql`${'parentId'} IS NULL`;
    
    const [ latest ] = await db.sql<s.securityGroups.SQL, s.securityGroups.Selectable[]>`
      SELECT * FROM ${'securityGroups'}
      WHERE ${'keyEnd'} IS NOT NULL AND ${whereParent}
      ORDER BY ${'keyEnd'} DESC
      LIMIT 1
    `.run(txOrPool);

    return latest;
  };

  const getParentKey = async (parentId: string | null, txOrPool: TxOrPool = pool) => {
    if (parentId) {
      return await getSecurityGroup({ id: parentId }, { bypassKeyCheck: true }, txOrPool);
    }
    return { keyStart: 0, keyEnd: KEY_MAX };
  };

  const generateKey = async (parentId: string | null, txOrPool: TxOrPool = pool): Promise<SecurityKey> => {
    const { keyStart: keyMin, keyEnd: keyMax } = await getParentKey(parentId, txOrPool);

    const latest = await getLatest(parentId, txOrPool);
    const keyStart = Number(latest?.keyEnd ? Number(latest.keyEnd) + 1 : keyMin);
    const keyEnd = keyStart + Number(Math.round((keyMax as number) / MAX_ENTITIES));

    return { keyStart, keyEnd };
  };

  const addSecurityGroup = async (securityGroup: s.securityGroups.Insertable, txOrPool: TxOrPool = pool) => {
    const key = await generateKey(securityGroup.parentId as string, txOrPool);
    const withKey = { ...securityGroup, createdBy: u, ...key, identifier: generateIdentifier(securityGroup) };

    const [inserted] = await db.sql<s.securityGroups.SQL, s.securityGroups.Selectable[]>`
      INSERT INTO ${'securityGroups'} (${db.cols(withKey)})
      VALUES (${db.vals(withKey)}) RETURNING *`
    .run(txOrPool);

    if (inserted === undefined) return;

    const start = toNumber(String(inserted.keyStart)),
          end = toNumber(String(inserted.keyEnd));

    if (!securityGroup.parentId && start !== undefined && end !== undefined) {
      const userService = UserService(u);
      await userService.addSecurityKey({ 
        id: u.id, organization: u.organization, entity: 'security-group', 
        key: [ start, end ] });
    }

    return inserted;
  };

  const updateSecurityGroup = async ({ id, ...securityGroup }: s.securityGroups.Updatable, txOrPool: TxOrPool = pool) => {
    const [ update ] = 
      await db.update('securityGroups', { ...securityGroup, updatedBy: u }, { id: id as string })
      .run(txOrPool);
    return update;
  };
  
  const checkForFullAccess = (keys: Array<SecurityKey>, securityGroups: Array<SecurityGroup>) => {
    return (keys?.find(k => k.keyStart === KEY_MIN && k.keyEnd === KEY_MAX))
      ? [ create({ 
            name: "Full Authorization", 
            identifier: "full-authorization",
            localities: [], 
            parentId: null,
            keyStart: KEY_MIN as unknown as db.Int8String, 
            keyEnd: KEY_MAX as unknown as db.Int8String, 
            createdAt: new Date(), 
            isArchived: false }), ...securityGroups ]
      : securityGroups;
  };

  type AllowFullAccess = { allowFullAccess?: boolean };

  const listSecurityGroups = async (query: KeyQueryOptions & AllowFullAccess = { isArchived: false, allowFullAccess: false }, txOrPool: TxOrPool = pool) => {
    const keys = query.keys || u.keys.securityGroup;

    const whereParent = query.parentId 
      ? db.sql`main.${'parentId'} = ${db.param(query.parentId)}`
      : db.sql`main.${'parentId'} IS NULL`;

    const archived = db.sql` AND main.${'isArchived'} = ${db.raw(query.isArchived ? 'TRUE' : 'FALSE')}`;

    const securityGroups = await db.sql<s.securityGroups.SQL, s.securityGroups.Selectable[]>`
      SELECT main.*, COUNT(g.${'id'}) AS "groupCount" 
      FROM ${'securityGroups'} AS main
      LEFT JOIN ${'securityGroups'} AS g ON main.${'id'} = g.${'parentId'}
      WHERE ${whereKeys({ keys, ...query })} AND ${whereParent} ${archived}
      GROUP BY main.${'id'}
    `.run(txOrPool);

    return query.allowFullAccess ? checkForFullAccess(keys, securityGroups) : securityGroups;
  };

  const getSecurityGroup = async ({ id }: IdProp, { bypassKeyCheck = false }: BypassKeyCheck = {}, txOrPool: TxOrPool = pool) => {
    const keys = u.keys.securityGroup;

    const [ securityGroup ] = await db.sql<s.securityGroups.SQL, s.securityGroups.Selectable[]>`
      SELECT main.*, p.${'name'} AS parent 
      FROM ${'securityGroups'} AS main
      LEFT JOIN ${'securityGroups'} AS p ON main.${'parentId'} = p.${'id'}
      WHERE ${whereKeys({ keys, bypassKeyCheck })} AND 
        (main.${'id'} = ${db.param(id)} OR LOWER(main.${'identifier'}) = ${db.param(id.toLowerCase())})
    `.run(txOrPool);

    return securityGroup;
  };

  const getSecurityGroupByName = async ({ name }: NameProp, { bypassKeyCheck = false }: BypassKeyCheck = {}, txOrPool: TxOrPool = pool) => {
    const keys = u.keys.securityGroup;

    const [ securityGroup ] = await db.sql<s.securityGroups.SQL, s.securityGroups.Selectable[]>`
      SELECT main.* FROM ${'securityGroups'} AS main
      WHERE ${whereKeys({ keys, bypassKeyCheck })} AND LOWER(main.${'name'}) = ${db.param(name.toLowerCase())}
    `.run(txOrPool);

    return securityGroup;
  };

  // Required to determine exactly which entities a user has authorization for
  const listSecurityGroupsForKeys = async ({ keys }: KeyQueryOptions, txOrPool: TxOrPool = pool) => {
    if (keys === undefined) return [];
    const securityGroups = await db.sql<s.securityGroups.SQL, s.securityGroups.Selectable[]>`
      SELECT main.* FROM ${'securityGroups'} AS main
      WHERE ${whereExactKeys({ keys })}
    `.run(txOrPool);

    return checkForFullAccess(keys, securityGroups);    
  };

  return {
    addSecurityGroup,
    updateSecurityGroup,
    getSecurityGroup,
    getSecurityGroupByName,
    listSecurityGroups,
    listSecurityGroupsForKeys
  };
};

export default Service;