import type * as s from 'zapatos/schema';
import * as db from 'zapatos/db';
import pool from '../db.server';

export { default as create } from '../id.server';

import ClientService from './clients.server';
import LegalEntityService from './legal-entities.server';

import type { SearchOptions as BaseSearchOptions, Count,
  QueryOptions, IdProp, KeyQueryOptions } from '../types';
import { ASC, DESC } from '../types';
  
import { type User } from '../access/users.server';

export type PersonSecurityKey = {
  clientKeyStart: number;
  clientKeyEnd: number;
  legalEntityKeyStart: number;
  legalEntityKeyEnd: number;
};

import { extractKeys } from './shared.server';

export type Person = s.people.Selectable & { legalEntity: string, client: string };

type SearchOptions = {
  clientId?: string | null | undefined;
  legalEntityId?: string | null | undefined;
} & BaseSearchOptions;

const generateIdentifier = ({ firstName, lastName, identifier }: s.people.Insertable) =>
  identifier !== "" && identifier != null
    ? identifier
    : `${firstName} ${lastName}`
        .replace(/([a-z])([A-Z])/g, "$1-$2")
        .replace(/[\s_]+/g, '-')
        .toLowerCase();

export const whereClientKeys = ({ keys }: KeyQueryOptions) => {
  let byKeys = db.sql<db.SQL>`${'people'}.${'id'} IS NULL`; // Ensure nothing is returned with no keys

  if (keys) {
    for (let i = 0; i < keys?.length; i++) {
      const { keyStart, keyEnd } = keys[i];
      byKeys = db.sql<db.SQL>`${byKeys} OR (${db.param(keyStart)} <= ${'clientKeyStart'} AND ${db.param(keyEnd)} >= ${'clientKeyEnd'})`;
    };
  }
  return db.sql<db.SQL>`(${byKeys})`;
};

export const whereLegalEntityKeys = ({ keys }: KeyQueryOptions) => {
  let byKeys = db.sql<db.SQL>`${'people'}.${'id'} IS NULL`; // Ensure nothing is returned with no keys

  if (keys) {
    for (let i = 0; i < keys?.length; i++) {
      const { keyStart, keyEnd } = keys[i];
      byKeys = db.sql<db.SQL>`${byKeys} OR (${db.param(keyStart)} <= ${'legalEntityKeyStart'} AND ${db.param(keyEnd)} >= ${'legalEntityKeyEnd'})`;
    };
  }
  return db.sql<db.SQL>`(${byKeys})`;
};

const service = (u: User) => {
  const getLatestForClient = async (person: s.people.Insertable) => {
    const query = db.sql<db.SQL>`${'clientId'} = ${db.param(person.clientId)}`;

    const [ latest ] = await db.sql<s.people.SQL, s.people.Selectable[]>`
      SELECT * FROM ${'people'}
      WHERE ${'clientKeyEnd'} IS NOT NULL AND ${query}
      ORDER BY ${'clientKeyEnd'} DESC
      LIMIT 1
      `.run(pool);
    return latest;
  };

  const getLatestForLegalEntity = async (person: s.people.Insertable) => {
    const query = db.sql<db.SQL>`${'legalEntityId'} = ${db.param(person.legalEntityId)}`;

    const [ latest ] = await db.sql<s.people.SQL, s.people.Selectable[]>`
      SELECT * FROM ${'people'}
      WHERE ${'legalEntityKeyEnd'} IS NOT NULL AND ${query}
      ORDER BY ${'legalEntityKeyEnd'} DESC
      LIMIT 1
      `.run(pool);
    return latest;
  };

  const generateKeys = async (person: s.people.Insertable): Promise<PersonSecurityKey> => {
    const clientService = ClientService(u);
    const legalEntityService = LegalEntityService(u);

    const client = await clientService.getClient({ id: person.clientId as string })
    const legalEntity = await legalEntityService.getLegalEntity({ id: person.legalEntityId as string })
    const latestForClient = await getLatestForClient(person);
    const latestForLegalEntity = await getLatestForLegalEntity(person);
    const maxEntities = 10000; // Move to constants

    if (client === undefined || legalEntity === undefined) 
      throw new Error('Error generating security key');

    const clientKeyStart = Number(latestForClient?.clientKeyEnd ? Number(latestForClient.clientKeyEnd) + 1 : client.keyStart);
    const clientKeyEnd = clientKeyStart + Number(Math.round(client.keyEnd as unknown as number / maxEntities));
    const legalEntityKeyStart = Number(latestForLegalEntity?.legalEntityKeyEnd ? Number(latestForLegalEntity.legalEntityKeyEnd) + 1 : legalEntity.keyStart);
    const legalEntityKeyEnd = legalEntityKeyStart + Number(Math.round(legalEntity.keyEnd as unknown as number / maxEntities));
    
    return { clientKeyStart, clientKeyEnd, legalEntityKeyStart, legalEntityKeyEnd };
  };

  const addPerson = async (person: s.people.Insertable) => {
    const keys = await generateKeys(person);
    const withKeys = { ...person, ...keys, identifier: generateIdentifier(person) };

    const [inserted] = await db.sql<s.people.SQL, s.people.Selectable[]>`
      INSERT INTO ${'people'} (${db.cols(withKeys)})
      VALUES (${db.vals(withKeys)}) RETURNING *`.run(pool);

    return inserted;
  };

  const listPeople = async () => {
    const clientKeys = extractKeys(u, "serviceCentre", "client");
    const legalEntityKeys = extractKeys(u, "serviceCentre", "legalEntity");
    return db.sql<s.people.SQL, s.people.Selectable[]>`
      SELECT * FROM ${'people'}
      WHERE (${whereClientKeys({ keys: clientKeys })} OR 
             ${whereLegalEntityKeys({ keys: legalEntityKeys })})
    `.run(pool);
  };

  const searchQuery = ({ search, clientId, legalEntityId }: SearchOptions) => {
    const name = search == null ? db.sql<db.SQL>`${'lastName'} IS NOT NULL` : db.sql<db.SQL>`
      (LOWER(${'people'}.${'firstName'}) LIKE LOWER(${db.param(`${search}%`)}) OR
       LOWER(${'people'}.${'lastName'}) LIKE LOWER(${db.param(`${search}%`)}))`;

    const client = clientId == null ? db.sql<db.SQL>`${'people'}.${'clientId'} IS NOT NULL`
      : db.sql<db.SQL>`${'people'}.${'clientId'} = ${db.param(clientId)}`;
    const legalEntity = legalEntityId == null ? db.sql<db.SQL>`${'legalEntityId'} IS NOT NULL`
      : db.sql<db.SQL>`${'people'}.${'legalEntityId'} = ${db.param(legalEntityId)}`;

    return db.sql<db.SQL>`${name} AND ${client} AND ${legalEntity}`;    
  };

  const countPeople = async (search: SearchOptions) => {
    const clientKeys = extractKeys(u, "serviceCentre", "client");
    const legalEntityKeys = extractKeys(u, "serviceCentre", "legalEntity");
    const [ item ] = await db.sql<s.people.SQL, s.people.Selectable[]>`
      SELECT COUNT(${'people'}.${'id'}) AS count FROM ${'people'}
      WHERE 
        ${searchQuery(search)} AND 
        (${whereClientKeys({ keys: clientKeys })} OR 
         ${whereLegalEntityKeys({ keys: legalEntityKeys })})
    `.run(pool);

    const { count } = item as unknown as Count;
    return count;
  };

  const searchPeople = async (search: SearchOptions, { offset = 0, limit = 8, sortDirection = ASC }: QueryOptions) => {  
    const clientKeys = extractKeys(u, "serviceCentre", "client");
    const legalEntityKeys = extractKeys(u, "serviceCentre", "legalEntity");
    if (sortDirection == null || (sortDirection !== ASC && sortDirection !== DESC)) sortDirection = ASC;

    const people = await db.sql<s.people.SQL | s.legalEntities.SQL | s.clients.SQL, s.people.Selectable[]>`
      SELECT ${'people'}.*, c.name AS client, le.name AS "legalEntity" FROM ${'people'}
      LEFT JOIN ${'legalEntities'} AS le ON ${'people'}.${'legalEntityId'} = le.${'id'}
      LEFT JOIN ${'clients'} AS c ON ${'people'}.${'clientId'} = c.${'id'}
      WHERE 
        ${searchQuery(search)} AND 
        (${whereClientKeys({ keys: clientKeys })} OR 
         ${whereLegalEntityKeys({ keys: legalEntityKeys })})
      ORDER BY ${'people'}.${'lastName'} ${db.raw(sortDirection)}
      OFFSET ${db.param(offset)}
      LIMIT ${db.param(limit)}
      `.run(pool);
    const count = await countPeople(search);

    return { people, metadata: { count }};
  };

  const getPerson = async ({ id }: IdProp) => {
    const clientKeys = extractKeys(u, "serviceCentre", "client");
    const legalEntityKeys = extractKeys(u, "serviceCentre", "legalEntity");

    const [ person ] = await db.sql<s.people.SQL | s.legalEntities.SQL | s.clients.SQL, s.people.Selectable[]>`
      SELECT ${'people'}.*, c.name AS client, le.name AS "legalEntity" FROM ${'people'}
      LEFT JOIN ${'legalEntities'} AS le ON ${'people'}.${'legalEntityId'} = le.${'id'}
      LEFT JOIN ${'clients'} AS c ON ${'people'}.${'clientId'} = c.${'id'}
      WHERE 
        (${'people'}.${'id'} = ${db.param(id)} OR LOWER(${'people'}.${'identifier'}) = ${db.param(id.toLowerCase())}) AND
        (${whereClientKeys({ keys: clientKeys })} OR 
         ${whereLegalEntityKeys({ keys: legalEntityKeys })})
      `.run(pool);

    return person;
  };

  return {
    addPerson,
    getPerson,
    searchPeople,
    countPeople,
    listPeople,
  };
};

export default service;