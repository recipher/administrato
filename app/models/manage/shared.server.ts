import * as db from 'zapatos/db';
import * as s from 'zapatos/schema';

import { type KeyQueryOptions } from '../types';
import { type User } from '../access/users.server';

export const whereKeys = ({ keys, isArchived = false, bypassKeyCheck = false }: KeyQueryOptions) => {
  const byIsArchived = db.sql<db.SQL>`${'isArchived'} = ${db.param(isArchived)}`;

  if (bypassKeyCheck === true) return byIsArchived;

  let byKeys = db.sql<db.SQL>`${'id'} = 0`; // Ensure nothing is returned with no keys

  if (keys) {
    for (let i = 0; i < keys?.length; i++) {
      const { keyStart, keyEnd } = keys[i];
      byKeys = db.sql<db.SQL>`${byKeys} OR (${db.param(keyStart)} <= ${'keyStart'} AND ${db.param(keyEnd)} >= ${'keyEnd'})`;
    };
  }
  return db.sql<db.SQL>`(${byIsArchived} AND (${byKeys}))`;
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
};

export const extractKeys = (u: User, ...sets: Array<"serviceCentre" | "client" | "provider" | "legalEntity">) =>
  sets.map(set => u.keys[set] || []).flat();

type EntityWithNameAndIdentifier = 
  s.serviceCentres.Insertable | s.clients.Insertable | s.legalEntities.Insertable | s.providers.Insertable;

export const generateIdentifier = ({ name, identifier }: EntityWithNameAndIdentifier) =>
  identifier !== "" && identifier != null
    ? identifier
    : (name as string)
        .replace(/([a-z])([A-Z])/g, "$1-$2")
        .replace(/[\s_]+/g, '-')
        .toLowerCase();