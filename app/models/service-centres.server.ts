import type * as s from 'zapatos/schema';
import * as db from 'zapatos/db';
import pool from './db.server';

import { type QueryOptions as BaseQueryOptions } from './types';

import { type User } from './users.server';

const keyMax = Number.MAX_SAFE_INTEGER;
const maxEntities = 50;

export type SecurityKey = {
  keyStart: number;
  keyEnd: number;
};

export type SecurityKeys = Array<SecurityKey>;

export type ServiceCentre = s.serviceCentres.Selectable;

type QueryOptions = {
  keys?: SecurityKeys;
  isArchived?: boolean;
} & BaseQueryOptions;

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

    return inserted;
  };

  const where = ({ keys, isArchived = false }: QueryOptions) => {
    let byKeys = db.sql<db.SQL>`${'id'} = 0`;

    if (keys) {
      for (let i = 0; i < keys?.length; i++) {
        const { keyStart, keyEnd } = keys[i];
        byKeys = db.sql<db.SQL>`${byKeys} OR (${db.param(keyStart)} <= ${'keyStart'} AND ${db.param(keyEnd)} >= ${'keyEnd'})`;
      };
    }
    return db.sql<db.SQL>`${'isArchived'} = ${db.param(isArchived)} AND (${byKeys})`;
  };

  const listServiceCentres = async (query: QueryOptions = { isArchived: false }) => {
    // @ts-ignore
    const keys = query.keys || u.keys.serviceCentre;
    return await db.sql<s.serviceCentres.SQL, s.serviceCentres.Selectable[]>`
      SELECT * FROM ${'serviceCentres'}
      WHERE ${where({ keys, ...query })}
      `.run(pool);
  };

  // Required to determine exactly which entities a user has authorization for
  const listServiceCentresForKeys = async ({ keys }: QueryOptions) => {
    let query = db.sql<db.SQL>`${'id'} = 0`;

    if (keys) {
      for (let i = 0; i < keys?.length; i++) {
        const { keyStart, keyEnd } = keys[i];
        query = db.sql<db.SQL>`${query} OR (${db.param(keyStart)} = ${'keyStart'} AND ${db.param(keyEnd)} = ${'keyEnd'})`;
      };
    }

    return await db.sql<s.serviceCentres.SQL, s.serviceCentres.Selectable[]>`
      SELECT * FROM ${'serviceCentres'}
      WHERE ${query}
      `.run(pool);
  };

  return {
    addServiceCentre,
    listServiceCentres,
    listServiceCentresForKeys
  };
};

export default service;