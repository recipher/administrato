import * as db from 'zapatos/db';
import * as s from 'zapatos/schema';

import { type SecurityKey, type SecurityKeys, type KeyQueryOptions } from '../types';
import { type User } from '../access/users.server';
import { type ServiceCentre } from './service-centres.server';
import { type LegalEntity } from './legal-entities.server';
import { type Client } from './clients.server';
import { type Provider } from './providers.server';

export const whereKeys = ({ keys, isArchived = false, bypassKeyCheck = false }: KeyQueryOptions) => {
  const byIsArchived = db.sql<db.SQL>`main.${'isArchived'} = ${db.param(isArchived)}`;

  if (bypassKeyCheck === true) return byIsArchived;

  let byKeys = db.sql<db.SQL>`main.${'id'} = 0`; // Ensure nothing is returned with no keys

  if (keys) {
    for (let i = 0; i < keys?.length; i++) {
      const { keyStart, keyEnd } = keys[i];
      byKeys = db.sql<db.SQL>`${byKeys} OR (${db.param(keyStart)} <= main.${'keyStart'} AND ${db.param(keyEnd)} >= main.${'keyEnd'})`;
    };
  }
  return db.sql<db.SQL>`(${byIsArchived} AND (${byKeys}))`;
};

export const whereExactKeys = ({ keys }: KeyQueryOptions) => {
  let query = db.sql<db.SQL>`main.${'id'} = 0`;

  if (keys) {
    for (let i = 0; i < keys?.length; i++) {
      const { keyStart, keyEnd } = keys[i];
      query = db.sql<db.SQL>`${query} OR (${db.param(keyStart)} = main.${'keyStart'} AND ${db.param(keyEnd)} = main.${'keyEnd'})`;
    };
  }

  return query;
};

export type Authorizable = ServiceCentre | Client | Provider | LegalEntity;

export const pickKeys = (authorizable: Authorizable | undefined) => 
  authorizable ? [ { keyStart: Number(authorizable.keyStart || 0), keyEnd: Number(authorizable.keyEnd || 0) } ] : undefined;

export const concatKeys = (key: SecurityKey | undefined, extractedKeys: SecurityKeys) =>
  key ? [ key, extractedKeys ].flat() : extractedKeys;

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