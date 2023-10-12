import type * as s from 'zapatos/schema';
import * as db from 'zapatos/db';
import pool from '../db.server';

export { default as create } from '../id.server';

import ClientService from './clients.server';
import LegalEntityService from './legal-entities.server';

import type { SearchOptions as BaseSearchOptions, Count, TxOrPool,
  QueryOptions, IdProp, KeyQueryOptions } from '../types';
import { ASC, DESC } from '../types';
  
import { type User } from '../access/users.server';

export type PersonSecurityKey = {
  clientKeyStart: number | undefined;
  clientKeyEnd: number | undefined;
  legalEntityKeyStart: number | undefined;
  legalEntityKeyEnd: number | undefined;
};

import { extractKeys } from './shared.server';

export type Person = s.people.Selectable & { legalEntity: string, client: string };

export enum Classifier {
  Worker = "worker",
  Employee = "employee",
  Contractor = "contractor",
  Person = "person",
};

type SearchOptions = {
  clientId?: string | null | undefined;
  legalEntityId?: string | null | undefined;
  classifier?: Classifier | null | undefined;
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

const Service = (u: User) => {
  const getLatestForClient = async (person: s.people.Insertable, txOrPool: TxOrPool = pool) => {
    const query = db.sql<db.SQL>`${'clientId'} = ${db.param(person.clientId)}`;

    const [ latest ] = await db.sql<s.people.SQL, s.people.Selectable[]>`
      SELECT * FROM ${'people'}
      WHERE ${'clientKeyEnd'} IS NOT NULL AND ${query}
      ORDER BY ${'clientKeyEnd'} DESC
      LIMIT 1
    `.run(txOrPool);
    return latest;
  };

  const getLatestForLegalEntity = async (person: s.people.Insertable, txOrPool: TxOrPool = pool) => {
    const query = db.sql<db.SQL>`${'legalEntityId'} = ${db.param(person.legalEntityId)}`;

    const [ latest ] = await db.sql<s.people.SQL, s.people.Selectable[]>`
      SELECT * FROM ${'people'}
      WHERE ${'legalEntityKeyEnd'} IS NOT NULL AND ${query}
      ORDER BY ${'legalEntityKeyEnd'} DESC
      LIMIT 1
    `.run(txOrPool);
    return latest;
  };

  const generateKeys = async (person: s.people.Insertable, txOrPool: TxOrPool = pool): Promise<PersonSecurityKey> => {
    let clientKeyStart, clientKeyEnd, legalEntityKeyStart, legalEntityKeyEnd;

    const maxEntities = 10000; // Move to constants

    if (person.clientId) {
      const clientService = ClientService(u);
      const client = await clientService.getClient({ id: person.clientId as string }, { bypassKeyCheck: true }, txOrPool)
      const latestForClient = await getLatestForClient(person, txOrPool);

      if (client === undefined) 
        throw new Error('Error generating security key');

      clientKeyStart = Number(latestForClient?.clientKeyEnd ? Number(latestForClient.clientKeyEnd) + 1 : client.keyStart);
      clientKeyEnd = clientKeyStart + Number(Math.round(client.keyEnd as unknown as number / maxEntities));
    }

    if (person.legalEntityId) {
      const legalEntityService = LegalEntityService(u);
      const legalEntity = await legalEntityService.getLegalEntity({ id: person.legalEntityId as string }, { bypassKeyCheck: true }, txOrPool)
      const latestForLegalEntity = await getLatestForLegalEntity(person, txOrPool);

      if (legalEntity === undefined) 
        throw new Error('Error generating security key');

      legalEntityKeyStart = Number(latestForLegalEntity?.legalEntityKeyEnd ? Number(latestForLegalEntity.legalEntityKeyEnd) + 1 : legalEntity.keyStart);
      legalEntityKeyEnd = legalEntityKeyStart + Number(Math.round(legalEntity.keyEnd as unknown as number / maxEntities));
    }
    
    return { clientKeyStart, clientKeyEnd, legalEntityKeyStart, legalEntityKeyEnd };
  };

  const addPerson = async (person: s.people.Insertable, txOrPool: TxOrPool = pool) => {
    const keys = await generateKeys(person);
    const withKeys = { ...person, ...keys, identifier: generateIdentifier(person) };

    const [inserted] = await db.sql<s.people.SQL, s.people.Selectable[]>`
      INSERT INTO ${'people'} (${db.cols(withKeys)})
      VALUES (${db.vals(withKeys)}) RETURNING *`
    .run(txOrPool);

    return inserted;
  };

  const addWorker = async (worker: s.people.Insertable, txOrPool: TxOrPool = pool) =>
    addPerson({ ...worker, classifier: Classifier.Worker }, txOrPool);

  const addContractor = async (worker: s.people.Insertable, txOrPool: TxOrPool = pool) =>
    addPerson({ ...worker, classifier: Classifier.Contractor }, txOrPool);

  const addEmployee = async (worker: s.people.Insertable, txOrPool: TxOrPool = pool) =>
    addPerson({ ...worker, classifier: Classifier.Employee }, txOrPool);

  const listPeople = async (txOrPool: TxOrPool = pool) => {
    const clientKeys = extractKeys(u, "serviceCentre", "client");
    const legalEntityKeys = extractKeys(u, "serviceCentre", "legalEntity");
    return db.sql<s.people.SQL, s.people.Selectable[]>`
      SELECT * FROM ${'people'}
      WHERE (${whereClientKeys({ keys: clientKeys })} OR 
             ${whereLegalEntityKeys({ keys: legalEntityKeys })})
    `.run(txOrPool);
  };

  const searchQuery = ({ search, clientId, legalEntityId, classifier }: SearchOptions) => {
    const name = search == null ? db.sql<db.SQL>`${'lastName'} IS NOT NULL` : db.sql<db.SQL>`
      (LOWER(${'people'}.${'firstName'}) LIKE LOWER(${db.param(`${search}%`)}) OR
       LOWER(${'people'}.${'lastName'}) LIKE LOWER(${db.param(`${search}%`)}))`;

    const client = clientId == null ? db.sql``
      : db.sql<db.SQL>`AND ${'people'}.${'clientId'} = ${db.param(clientId)}`;
    const legalEntity = legalEntityId == null ? db.sql``
      : db.sql<db.SQL>`AND ${'people'}.${'legalEntityId'} = ${db.param(legalEntityId)}`;
    const classification = classifier == null ? db.sql``
      : db.sql<db.SQL>`AND ${'people'}.${'classifier'} = ${db.param(classifier)}`;

    return db.sql<db.SQL>`${name} ${client} ${legalEntity} ${classification}`;    
  };

  const countPeople = async (search: SearchOptions, txOrPool: TxOrPool = pool) => {
    const clientKeys = extractKeys(u, "serviceCentre", "client");
    const legalEntityKeys = extractKeys(u, "serviceCentre", "legalEntity");
    const [ item ] = await db.sql<s.people.SQL, s.people.Selectable[]>`
      SELECT COUNT(${'people'}.${'id'}) AS count FROM ${'people'}
      WHERE 
        ${searchQuery(search)} AND 
        (${whereClientKeys({ keys: clientKeys })} OR 
         ${whereLegalEntityKeys({ keys: legalEntityKeys })})
    `.run(txOrPool);

    const { count } = item as unknown as Count;
    return count;
  };

  const searchPeople = async (search: SearchOptions, { offset = 0, limit = 8, sortDirection = ASC }: QueryOptions, txOrPool: TxOrPool = pool) => {  
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
    `.run(txOrPool);
    const count = await countPeople(search, txOrPool);

    return { people, metadata: { count }};
  };

  const searchWorkers =  async (search: SearchOptions, meta: QueryOptions, txOrPool: TxOrPool = pool) =>
    searchPeople({ ...search, classifier: Classifier.Worker }, meta, txOrPool); 

  const searchContractors =  async (search: SearchOptions, meta: QueryOptions, txOrPool: TxOrPool = pool) =>
    searchPeople({ ...search, classifier: Classifier.Contractor }, meta, txOrPool); 

  const searchEmployees =  async (search: SearchOptions, meta: QueryOptions, txOrPool: TxOrPool = pool) =>
    searchPeople({ ...search, classifier: Classifier.Employee }, meta, txOrPool); 

  const getPerson = async ({ id }: IdProp, txOrPool: TxOrPool = pool) => {
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
    `.run(txOrPool);

    return person;
  };

  return {
    addPerson,
    addWorker,
    addContractor,
    addEmployee,
    getPerson,
    searchPeople,
    searchWorkers,
    searchEmployees,
    searchContractors,
    countPeople,
    listPeople,
  };
};

export default Service;