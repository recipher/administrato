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

const KEY_MIN = 0;
const KEY_MAX = Number.MAX_SAFE_INTEGER;
const MAX_ENTITIES = 100;

type KeyQueryOptions = BaseKeyQueryOptions & {
  parentId?: string | undefined;
};

export type ServiceCentre = s.serviceCentres.Selectable & { groupCount?: number };

const Service = (u: User) => {
  const getLatest = async (parentId: string | null, txOrPool: TxOrPool = pool) => {
    const whereParent = parentId
      ? db.sql`${'parentId'} = ${db.param(parentId)}`
      : db.sql`${'parentId'} IS NULL`;
    
    const [ latest ] = await db.sql<s.serviceCentres.SQL, s.serviceCentres.Selectable[]>`
      SELECT * FROM ${'serviceCentres'}
      WHERE ${'keyEnd'} IS NOT NULL AND ${whereParent}
      ORDER BY ${'keyEnd'} DESC
      LIMIT 1
    `.run(txOrPool);

    return latest;
  };

  const getParentKey = async (parentId: string | null, txOrPool: TxOrPool = pool) => {
    if (parentId) {
      return await getServiceCentre({ id: parentId }, { bypassKeyCheck: true }, txOrPool);
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

  const addServiceCentre = async (serviceCentre: s.serviceCentres.Insertable, txOrPool: TxOrPool = pool) => {
    const key = await generateKey(serviceCentre.parentId as string, txOrPool);
    const withKey = { ...serviceCentre, ...key, identifier: generateIdentifier(serviceCentre) };

    const [inserted] = await db.sql<s.serviceCentres.SQL, s.serviceCentres.Selectable[]>`
      INSERT INTO ${'serviceCentres'} (${db.cols(withKey)})
      VALUES (${db.vals(withKey)}) RETURNING *`
    .run(txOrPool);

    if (inserted === undefined) return;

    const start = toNumber(String(inserted.keyStart)),
          end = toNumber(String(inserted.keyEnd));

    if (!serviceCentre.parentId && start !== undefined && end !== undefined) {
      const userService = UserService(u);
      await userService.addSecurityKey({ 
        id: u.id, organization: u.organization, entity: 'service-centre', 
        key: [ start, end ] });
    }

    return inserted;
  };

  const updateServiceCentre = async ({ id, ...serviceCentre }: s.serviceCentres.Updatable, txOrPool: TxOrPool = pool) => {
    const [ update ] = 
      await db.update('serviceCentres', serviceCentre, { id: id as string }).run(txOrPool);
    return update;
  };
  
  const checkForFullAccess = (keys: Array<SecurityKey>, serviceCentres: Array<ServiceCentre>) => {
    return (keys.find(k => k.keyStart === KEY_MIN && k.keyEnd === KEY_MAX))
      ? [ create({ 
            name: "Full Authorization", 
            identifier: "full-authorization",
            localities: [], 
            parentId: null,
            keyStart: KEY_MIN as unknown as db.Int8String, 
            keyEnd: KEY_MAX as unknown as db.Int8String, 
            createdAt: new Date(), 
            isArchived: false }), ...serviceCentres ]
      : serviceCentres;
  };

  type AllowFullAccess = { allowFullAccess?: boolean };

  const listServiceCentres = async (query: KeyQueryOptions & AllowFullAccess = { isArchived: false, allowFullAccess: false }, txOrPool: TxOrPool = pool) => {
    const keys = query.keys || u.keys.serviceCentre;

    const whereParent = query.parentId 
      ? db.sql`main.${'parentId'} = ${db.param(query.parentId)}`
      : db.sql`main.${'parentId'} IS NULL`;

    const archived = db.sql` AND main.${'isArchived'} = ${db.raw(query.isArchived ? 'TRUE' : 'FALSE')}`;

    const serviceCentres = await db.sql<s.serviceCentres.SQL, s.serviceCentres.Selectable[]>`
      SELECT main.*, COUNT(g.${'id'}) AS "groupCount" 
      FROM ${'serviceCentres'} AS main
      LEFT JOIN ${'serviceCentres'} AS g ON main.${'id'} = g.${'parentId'}
      WHERE ${whereKeys({ keys, ...query })} AND ${whereParent} ${archived}
      GROUP BY main.${'id'}
    `.run(txOrPool);

    return query.allowFullAccess ? checkForFullAccess(keys, serviceCentres) : serviceCentres;
  };

  const getServiceCentre = async ({ id }: IdProp, { bypassKeyCheck = false }: BypassKeyCheck = {}, txOrPool: TxOrPool = pool) => {
    const keys = u.keys.serviceCentre;

    const [ serviceCentre ] = await db.sql<s.serviceCentres.SQL, s.serviceCentres.Selectable[]>`
      SELECT main.*, p.${'name'} AS parent 
      FROM ${'serviceCentres'} AS main
      LEFT JOIN ${'serviceCentres'} AS p ON main.${'parentId'} = p.${'id'}
      WHERE ${whereKeys({ keys, bypassKeyCheck })} AND 
        (main.${'id'} = ${db.param(id)} OR LOWER(main.${'identifier'}) = ${db.param(id.toLowerCase())})
    `.run(txOrPool);

    return serviceCentre;
  };

  const getServiceCentreByName = async ({ name }: NameProp, { bypassKeyCheck = false }: BypassKeyCheck = {}, txOrPool: TxOrPool = pool) => {
    const keys = u.keys.serviceCentre;

    const [ serviceCentre ] = await db.sql<s.serviceCentres.SQL, s.serviceCentres.Selectable[]>`
      SELECT main.* FROM ${'serviceCentres'} AS main
      WHERE ${whereKeys({ keys, bypassKeyCheck })} AND LOWER(main.${'name'}) = ${db.param(name.toLowerCase())}
    `.run(txOrPool);

    return serviceCentre;
  };

  // Required to determine exactly which entities a user has authorization for
  const listServiceCentresForKeys = async ({ keys }: KeyQueryOptions, txOrPool: TxOrPool = pool) => {
    if (keys === undefined) return [];
    const serviceCentres = await db.sql<s.serviceCentres.SQL, s.serviceCentres.Selectable[]>`
      SELECT main.* FROM ${'serviceCentres'} AS main
      WHERE ${whereExactKeys({ keys })}
    `.run(txOrPool);

    return checkForFullAccess(keys, serviceCentres);    
  };

  return {
    addServiceCentre,
    updateServiceCentre,
    getServiceCentre,
    getServiceCentreByName,
    listServiceCentres,
    listServiceCentresForKeys
  };
};

export default Service;