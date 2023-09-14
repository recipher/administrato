import type * as s from 'zapatos/schema';
import * as db from 'zapatos/db';
import pool from '../db.server';

import type { SecurityKey, IdProp, KeyQueryOptions } from '../types';

import UserService, { type User } from '../access/users.server';
import toNumber from '~/helpers/to-number';

import { whereKeys, whereExactKeys } from './shared.server';

const keyMax = Number.MAX_SAFE_INTEGER;
const maxEntities = 50;

export type ServiceCentre = s.serviceCentres.Selectable;

const service = (u: User) => {
  const getLatest = async () => {
    const [ latest ] = await db.sql<s.serviceCentres.SQL, s.serviceCentres.Selectable[]>`
    SELECT * FROM ${'serviceCentres'}
    WHERE ${'keyEnd'} IS NOT NULL
    ORDER BY ${'keyEnd'} DESC
    LIMIT 1
    `.run(pool);
    return latest;
  };

  const generateKey = async (): Promise<SecurityKey> => {
    const latest = await getLatest();
    const keyStart = Number(latest?.keyEnd ? Number(latest.keyEnd) + 1 : 0);
    const keyEnd = keyStart + Number(Math.round(keyMax / maxEntities));

    return { keyStart, keyEnd };
  };

  const addServiceCentre = async (serviceCentre: s.serviceCentres.Insertable) => {
    const key = await generateKey();
    const withKey = { ...serviceCentre, ...key };

    const [inserted] = await db.sql<s.serviceCentres.SQL, s.serviceCentres.Selectable[]>`
      INSERT INTO ${'serviceCentres'} (${db.cols(withKey)})
      VALUES (${db.vals(withKey)}) RETURNING *`.run(pool);

    if (inserted === undefined) return;

    const start = toNumber(String(inserted.keyStart)),
          end = toNumber(String(inserted.keyEnd));

    if (start && end) {
      const userService = UserService(u);
      await userService.addSecurityKey({ 
        id: u.id, organization: u.organization, entity: 'service-centre', 
        key: [ start, end ] });
    }

    return inserted;
  };

  const listServiceCentres = async (query: KeyQueryOptions = { isArchived: false }) => {
    const keys = query.keys || u.keys.serviceCentre;
    return await db.sql<s.serviceCentres.SQL, s.serviceCentres.Selectable[]>`
      SELECT * FROM ${'serviceCentres'}
      WHERE ${whereKeys({ keys, ...query })}
      `.run(pool);
  };

  const getServiceCentre = async ({ id }: IdProp) => {
    const keys = u.keys.serviceCentre;
    const [ serviceCentre ] = await db.sql<s.serviceCentres.SQL, s.serviceCentres.Selectable[]>`
      SELECT * FROM ${'serviceCentres'}
      WHERE ${whereKeys({ keys })} AND ${'id'} = ${db.param(id)}
      `.run(pool);

    return serviceCentre;
  };

  // Required to determine exactly which entities a user has authorization for
  const listServiceCentresForKeys = async ({ keys }: KeyQueryOptions) => {
    if (keys === undefined) return [];
    return await db.sql<s.serviceCentres.SQL, s.serviceCentres.Selectable[]>`
      SELECT * FROM ${'serviceCentres'}
      WHERE ${whereExactKeys({ keys })}
      `.run(pool);
  };

  return {
    addServiceCentre,
    getServiceCentre,
    listServiceCentres,
    listServiceCentresForKeys
  };
};

export default service;