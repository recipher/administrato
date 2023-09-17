import type * as s from 'zapatos/schema';
import * as db from 'zapatos/db';
import pool from '../db.server';

import ClientService from './clients.server';
import LegalEntityService from './legal-entities.server';

import type { SearchOptions as BaseSearchOptions, Count,
  QueryOptions, IdProp, KeyQueryOptions } from '../types';
import { ASC, DESC } from '../types';
  
import { type User } from '../access/users.server';

export type WorkerSecurityKey = {
  clientKeyStart: number;
  clientKeyEnd: number;
  legalEntityKeyStart: number;
  legalEntityKeyEnd: number;
};

import { whereExactKeys, extractKeys } from './shared.server';

export type Worker = s.workers.Selectable;

type SearchOptions = {
  clientId?: number | undefined;
  legalEntityId?: number | undefined;
} & BaseSearchOptions;

const generateIdentifier = ({ firstName, lastName, identifier }: s.workers.Insertable) =>
  identifier !== "" && identifier != null
    ? identifier
    : `${firstName} ${lastName}`
        .replace(/([a-z])([A-Z])/g, "$1-$2")
        .replace(/[\s_]+/g, '-')
        .toLowerCase();

export const whereClientKeys = ({ keys }: KeyQueryOptions) => {
  let byKeys = db.sql<db.SQL>`${'id'} = 0`; // Ensure nothing is returned with no keys

  if (keys) {
    for (let i = 0; i < keys?.length; i++) {
      const { keyStart, keyEnd } = keys[i];
      byKeys = db.sql<db.SQL>`${byKeys} OR (${db.param(keyStart)} <= ${'clientKeyStart'} AND ${db.param(keyEnd)} >= ${'clientKeyEnd'})`;
    };
  }
  return db.sql<db.SQL>`(${byKeys})`;
};

export const whereLegalEntityKeys = ({ keys }: KeyQueryOptions) => {
  let byKeys = db.sql<db.SQL>`${'id'} = 0`; // Ensure nothing is returned with no keys

  if (keys) {
    for (let i = 0; i < keys?.length; i++) {
      const { keyStart, keyEnd } = keys[i];
      byKeys = db.sql<db.SQL>`${byKeys} OR (${db.param(keyStart)} <= ${'legalEntityKeyStart'} AND ${db.param(keyEnd)} >= ${'legalEntityKeyEnd'})`;
    };
  }
  return db.sql<db.SQL>`(${byKeys})`;
};

const service = (u: User) => {
  const getLatestForClient = async (worker: s.workers.Insertable) => {
    const query = db.sql<db.SQL>`${'clientId'} = ${db.param(worker.clientId)}`;

    const [ latest ] = await db.sql<s.workers.SQL, s.workers.Selectable[]>`
      SELECT * FROM ${'workers'}
      WHERE ${'clientKeyEnd'} IS NOT NULL AND ${query}
      ORDER BY ${'clientKeyEnd'} DESC
      LIMIT 1
      `.run(pool);
    return latest;
  };

  const getLatestForLegalEntity = async (worker: s.workers.Insertable) => {
    const query = db.sql<db.SQL>`${'legalEntityId'} = ${db.param(worker.legalEntityId)}`;

    const [ latest ] = await db.sql<s.workers.SQL, s.workers.Selectable[]>`
      SELECT * FROM ${'workers'}
      WHERE ${'legalEntityKeyEnd'} IS NOT NULL AND ${query}
      ORDER BY ${'legalEntityKeyEnd'} DESC
      LIMIT 1
      `.run(pool);
    return latest;
  };

  const generateKeys = async (worker: s.workers.Insertable): Promise<WorkerSecurityKey> => {
    const clientService = ClientService(u);
    const legalEntityService = LegalEntityService(u);

    const client = await clientService.getClient({ id: worker.clientId as number })
    const legalEntity = await legalEntityService.getLegalEntity({ id: worker.legalEntityId as number })
    const latestForClient = await getLatestForClient(worker);
    const latestForLegalEntity = await getLatestForLegalEntity(worker);
    const maxEntities = 10000; // Move to constants

    if (client === undefined || legalEntity === undefined) 
      throw new Error('Error generating security key');

    const clientKeyStart = Number(latestForClient?.clientKeyEnd ? Number(latestForClient.clientKeyEnd) + 1 : client.keyStart);
    const clientKeyEnd = clientKeyStart + Number(Math.round(client.keyEnd as unknown as number / maxEntities));
    const legalEntityKeyStart = Number(latestForLegalEntity?.legalEntityKeyEnd ? Number(latestForLegalEntity.legalEntityKeyEnd) + 1 : legalEntity.keyStart);
    const legalEntityKeyEnd = legalEntityKeyStart + Number(Math.round(legalEntity.keyEnd as unknown as number / maxEntities));
    
    return { clientKeyStart, clientKeyEnd, legalEntityKeyStart, legalEntityKeyEnd };
  };

  const addWorker = async (worker: s.workers.Insertable) => {
    const keys = await generateKeys(worker);
    const withKeys = { ...worker, ...keys, identifier: generateIdentifier(worker) };

    const [inserted] = await db.sql<s.workers.SQL, s.workers.Selectable[]>`
      INSERT INTO ${'workers'} (${db.cols(withKeys)})
      VALUES (${db.vals(withKeys)}) RETURNING *`.run(pool);

    return inserted;
  };

  const listWorkers = async (query: KeyQueryOptions = { isArchived: false }) => {
    const clientKeys = extractKeys(u, "serviceCentre", "client");
    const legalEntityKeys = extractKeys(u, "serviceCentre", "legalEntity");
    return await db.sql<s.workers.SQL, s.workers.Selectable[]>`
      SELECT * FROM ${'workers'}
        ${whereClientKeys({ keys: clientKeys })} AND 
        ${whereLegalEntityKeys({ keys: legalEntityKeys })} 
    `.run(pool);
  };

  const searchQuery = ({ search, clientId, legalEntityId }: SearchOptions) => {
    const name = search == null ? db.sql<db.SQL>`${'lastName'} IS NOT NULL` : db.sql<db.SQL>`
      (LOWER(${'workers'}.${'firstName'}) LIKE LOWER('${db.raw(search)}%') OR
       LOWER(${'workers'}.${'lastName'}) LIKE LOWER('${db.raw(search)}%'))`;

    const client = clientId === undefined ? db.sql<db.SQL>`${'clientId'} IS NOT NULL`
      : db.sql<db.SQL>`${'clientId'} = ${db.param(clientId)}`;
    const legalEntity = legalEntityId === undefined ? db.sql<db.SQL>`${'legalEntityId'} IS NOT NULL`
      : db.sql<db.SQL>`${'legalEntityId'} = ${db.param(legalEntityId)}`;

    return db.sql<db.SQL>`${name} AND ${client} AND ${legalEntity}`;    
  };

  const countWorkers = async (search: SearchOptions) => {
    const clientKeys = extractKeys(u, "serviceCentre", "client");
    const legalEntityKeys = extractKeys(u, "serviceCentre", "legalEntity");
    const [ item ] = await db.sql<s.workers.SQL, s.workers.Selectable[]>`
      SELECT COUNT(${'id'}) AS count FROM ${'workers'}
      WHERE 
        ${searchQuery(search)} AND 
        ${whereClientKeys({ keys: clientKeys })} AND 
        ${whereLegalEntityKeys({ keys: legalEntityKeys })} 
    `.run(pool);

    const { count } = item as unknown as Count;
    return count;
  };

  const searchWorkers = async (search: SearchOptions, { offset = 0, limit = 8, sortDirection = ASC }: QueryOptions) => {  
    const clientKeys = extractKeys(u, "serviceCentre", "client");
    const legalEntityKeys = extractKeys(u, "serviceCentre", "legalEntity");
    if (sortDirection == null || (sortDirection !== ASC && sortDirection !== DESC)) sortDirection = ASC;

    const workers = await db.sql<s.workers.SQL, s.workers.Selectable[]>`
      SELECT * FROM ${'workers'}
      WHERE 
        ${searchQuery(search)} AND 
        ${whereClientKeys({ keys: clientKeys })} AND 
        ${whereLegalEntityKeys({ keys: legalEntityKeys })} 
      ORDER BY ${'workers'}.${'lastName'} ${db.raw(sortDirection)}
      OFFSET ${db.param(offset)}
      LIMIT ${db.param(limit)}
      `.run(pool);
    const count = await countWorkers(search);

    return { workers, metadata: { count }};
  };

  const getWorker = async ({ id }: IdProp) => {
    const clientKeys = extractKeys(u, "serviceCentre", "client");
    const legalEntityKeys = extractKeys(u, "serviceCentre", "legalEntity");
    const numericId = isNaN(parseInt(id as string)) ? 0 : id;

    const [ worker ] = await db.sql<s.workers.SQL, s.workers.Selectable[]>`
      SELECT * FROM ${'workers'}
      WHERE 
        (${'id'} = ${db.param(numericId)} OR LOWER(${'identifier'}) = ${db.param(id.toString().toLowerCase())}) AND
        ${whereClientKeys({ keys: clientKeys })} AND 
        ${whereLegalEntityKeys({ keys: legalEntityKeys })} AND 
      `.run(pool);

    return worker;
  };

  return {
    addWorker,
    getWorker,
    searchWorkers,
    countWorkers,
    listWorkers,
  };
};

export default service;