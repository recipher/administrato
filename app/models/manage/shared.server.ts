import * as db from 'zapatos/db';

import { type KeyQueryOptions } from '../types';

export const whereKeys = ({ keys, isArchived = false }: KeyQueryOptions) => {
  let byKeys = db.sql<db.SQL>`${'id'} = 0`; // Ensure nothing is returned with no keys

  if (keys) {
    for (let i = 0; i < keys?.length; i++) {
      const { keyStart, keyEnd } = keys[i];
      byKeys = db.sql<db.SQL>`${byKeys} OR (${db.param(keyStart)} <= ${'keyStart'} AND ${db.param(keyEnd)} >= ${'keyEnd'})`;
    };
  }
  return db.sql<db.SQL>`(${'isArchived'} = ${db.param(isArchived)} AND (${byKeys}))`;
};

export const whereExactKeys = ({ keys }: KeyQueryOptions) => {
  let query = db.sql<db.SQL>`${'id'} = 0`;

  if (keys) {
    for (let i = 0; i < keys?.length; i++) {
      const { keyStart, keyEnd } = keys[i];
      query = db.sql<db.SQL>`${query} OR (${db.param(keyStart)} = ${'keyStart'} AND ${db.param(keyEnd)} = ${'keyEnd'})`;
    };
  }

  return query;
}