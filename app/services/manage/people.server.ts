import type * as s from 'zapatos/schema';
import * as db from 'zapatos/db';
import pool from '../db.server';
import NameConfigurator from 'i18n-postal-address';

import { default as create } from '../id.server';
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

export type Person = s.people.Selectable & { 
  name?: string;
  legalEntity?: string; 
  client?: string;
};

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

  const withName = (person: Person) => {
    const name = new NameConfigurator();
    if (person.honorific) name.setHonorific(person.honorific)
    name.setFirstName(person.firstName);
    if (person.secondName) name.setSecondName(person.secondName)
    name.setLastName(person.lastName);
    if (person.firstLastName) name.setFirstLastName(person.firstLastName)
    if (person.secondLastName) name.setSecondLastName(person.secondLastName)

    name.setFormat({ country: person.nationality });
    return { ...person, name: name.toString() };
  };

  const getLatestForClient = async (clientId: string, txOrPool: TxOrPool = pool) => {
    const query = db.sql<db.SQL>`cp.${'clientId'} = ${db.param(clientId)}`;

    const [ latest ] = await db.sql<s.people.SQL | s.clientPeople.SQL, s.people.Selectable[]>`
      SELECT * FROM ${'people'}
      LEFT JOIN ${'clientPeople'} AS cp ON cp.${'personId'} = ${'people'}.${'id'}
      WHERE ${'clientKeyEnd'} IS NOT NULL AND ${query}
      ORDER BY ${'clientKeyEnd'} DESC
      LIMIT 1
    `.run(txOrPool);
    return latest;
  };

  const getLatestForLegalEntity = async (legalEntityId: string, txOrPool: TxOrPool = pool) => {
    const query = db.sql<db.SQL>`lep.${'legalEntityId'} = ${db.param(legalEntityId)}`;

    const [ latest ] = await db.sql<s.people.SQL | s.legalEntityPeople.SQL, s.people.Selectable[]>`
      SELECT * FROM ${'people'}
      LEFT JOIN ${'legalEntityPeople'} AS lep ON lep.${'personId'} = ${'people'}.${'id'}
      WHERE ${'legalEntityKeyEnd'} IS NOT NULL AND ${query}
      ORDER BY ${'legalEntityKeyEnd'} DESC
      LIMIT 1
    `.run(txOrPool);
    return latest;
  };

  type Connections = { clientId?: string | null; legalEntityId?: string | null };

  const generateKeys = async (person: s.people.Insertable, connections: Connections, txOrPool: TxOrPool = pool): Promise<PersonSecurityKey> => {
    let clientKeyStart, clientKeyEnd, legalEntityKeyStart, legalEntityKeyEnd;

    const maxEntities = 10000; // Move to constants

    const { clientId, legalEntityId } = connections;

    if (clientId) {
      const clientService = ClientService(u);
      const client = await clientService.getClient({ id: clientId as string }, { bypassKeyCheck: true }, txOrPool)
      const latestForClient = await getLatestForClient(clientId, txOrPool);

      if (client === undefined) 
        throw new Error('Error generating security key');

      clientKeyStart = Number(latestForClient?.clientKeyEnd ? Number(latestForClient.clientKeyEnd) + 1 : client.keyStart);
      clientKeyEnd = clientKeyStart + Number(Math.round(client.keyEnd as unknown as number / maxEntities));
    }

    if (legalEntityId) {
      const legalEntityService = LegalEntityService(u);
      const legalEntity = await legalEntityService.getLegalEntity({ id: legalEntityId as string }, { bypassKeyCheck: true }, txOrPool)
      const latestForLegalEntity = await getLatestForLegalEntity(legalEntityId, txOrPool);

      if (legalEntity === undefined) 
        throw new Error('Error generating security key');

      legalEntityKeyStart = Number(latestForLegalEntity?.legalEntityKeyEnd ? Number(latestForLegalEntity.legalEntityKeyEnd) + 1 : legalEntity.keyStart);
      legalEntityKeyEnd = legalEntityKeyStart + Number(Math.round(legalEntity.keyEnd as unknown as number / maxEntities));
    }
    
    return { clientKeyStart, clientKeyEnd, legalEntityKeyStart, legalEntityKeyEnd };
  };
    
  const addPerson = async (person: s.people.Insertable, connections: Connections, txOrPool: TxOrPool = pool) => {
    const keys = await generateKeys(person, connections);
    const withKeys = { ...person, ...keys, identifier: generateIdentifier(person) };

    return await db.serializable(txOrPool, async tx => {
      const [ person ] = await db.sql<s.people.SQL, s.people.Selectable[]>`
        INSERT INTO ${'people'} (${db.cols(withKeys)})
        VALUES (${db.vals(withKeys)}) RETURNING *`
      .run(tx);

      if (person === undefined) throw new Error('Error adding person');

      const startOn = new Date();
      const { clientId, legalEntityId } = connections;
      if (clientId) await db.insert('clientPeople', create({ clientId, personId: person.id, startOn })).run(tx);
      if (legalEntityId) await db.insert('legalEntityPeople', create({ legalEntityId, personId: person.id, startOn })).run(tx);

      return person;
    });
  };

  const addWorker = async (person: s.people.Insertable, connections: Connections, txOrPool: TxOrPool = pool) =>
    addPerson({ ...person, classifier: Classifier.Worker }, connections, txOrPool);

  const addContractor = async (person: s.people.Insertable, connections: Connections, txOrPool: TxOrPool = pool) =>
    addPerson({ ...person, classifier: Classifier.Contractor }, connections, txOrPool);

  const addEmployee = async (person: s.people.Insertable, connections: Connections, txOrPool: TxOrPool = pool) =>
    addPerson({ ...person, classifier: Classifier.Employee }, connections, txOrPool);

  const updatePerson = async ({ id, ...person }: s.people.Updatable, txOrPool: TxOrPool = pool) => {
    const [ update ] = 
      await db.update('people', person, { id: id as string }).run(txOrPool);
    return update;
  };

  type peopleSQL = 
    s.people.SQL | 
    s.legalEntities.SQL | s.legalEntityPeople.SQL | 
    s.clients.SQL | s.clientPeople.SQL;

  const listPeople = async (txOrPool: TxOrPool = pool) => {
    const clientKeys = extractKeys(u, "securityGroup", "client");
    const legalEntityKeys = extractKeys(u, "securityGroup", "legalEntity");
    const people = await db.sql<peopleSQL, s.people.Selectable[]>`
      SELECT ${'people'}.*, c.name AS client, le.name AS "legalEntity" 
      FROM ${'people'}
      LEFT JOIN ${'legalEntityPeople'} AS lep ON lep.${'personId'} = ${'people'}.${'id'}
      LEFT JOIN ${'legalEntities'} AS le ON lep.${'legalEntityId'} = le.${'id'}
      LEFT JOIN ${'clientPeople'} AS cp ON cp.${'personId'} = ${'people'}.${'id'}
      LEFT JOIN ${'clients'} AS c ON cp.${'clientId'} = c.${'id'}
      WHERE (${whereClientKeys({ keys: clientKeys })} OR 
             ${whereLegalEntityKeys({ keys: legalEntityKeys })})
    `.run(txOrPool);

    return people.map(withName);
  };

  const searchQuery = ({ search, clientId, legalEntityId, classifier, isArchived }: SearchOptions) => {
    const name = search == null ? db.sql<db.SQL>`${'lastName'} IS NOT NULL` : db.sql<db.SQL>`
      (LOWER(${'people'}.${'firstName'}) LIKE LOWER(${db.param(`${search}%`)}) OR
       LOWER(${'people'}.${'lastName'}) LIKE LOWER(${db.param(`${search}%`)}))`;

    const client = clientId == null ? db.sql``
      : db.sql<db.SQL>`AND (cp.${'clientId'} = ${db.param(clientId)} AND cp.${'endOn'} IS NULL)`;
    const legalEntity = legalEntityId == null ? db.sql``
      : db.sql<db.SQL>`AND (lep.${'legalEntityId'} = ${db.param(legalEntityId)} AND lep.${'endOn'} IS NULL)`;
    const classification = classifier == null ? db.sql``
      : db.sql<db.SQL>`AND ${'people'}.${'classifier'} = ${db.param(classifier)}`;

    const archived = db.sql` AND ${'people'}.${'isArchived'} = ${db.raw(isArchived ? 'TRUE' : 'FALSE')}`;

    return db.sql<db.SQL>`${name} ${archived} ${client} ${legalEntity} ${classification}`;    
  };

  const countPeople = async (search: SearchOptions, txOrPool: TxOrPool = pool) => {
    const clientKeys = extractKeys(u, "securityGroup", "client");
    const legalEntityKeys = extractKeys(u, "securityGroup", "legalEntity");
    const [ item ] = await db.sql<peopleSQL, s.people.Selectable[]>`
      SELECT COUNT(${'people'}.${'id'}) AS count FROM ${'people'}
      LEFT JOIN ${'legalEntityPeople'} AS lep ON lep.${'personId'} = ${'people'}.${'id'}
      LEFT JOIN ${'clientPeople'} AS cp ON cp.${'personId'} = ${'people'}.${'id'}
      WHERE 
        ${searchQuery(search)} AND 
        (${whereClientKeys({ keys: clientKeys })} OR 
         ${whereLegalEntityKeys({ keys: legalEntityKeys })})
    `.run(txOrPool);

    const { count } = item as unknown as Count;
    return count;
  };

  const searchPeople = async (search: SearchOptions, { offset = 0, limit = 8, sortDirection = ASC }: QueryOptions, txOrPool: TxOrPool = pool) => {  
    const clientKeys = extractKeys(u, "securityGroup", "client");
    const legalEntityKeys = extractKeys(u, "securityGroup", "legalEntity");
    if (sortDirection == null || (sortDirection !== ASC && sortDirection !== DESC)) sortDirection = ASC;

    const people = await db.sql<peopleSQL, s.people.Selectable[]>`
      SELECT ${'people'}.*, c.name AS client, le.name AS "legalEntity", c.id AS "clientId", le.id AS "legalEntityId"  
      FROM ${'people'}
      LEFT JOIN ${'legalEntityPeople'} AS lep ON lep.${'personId'} = ${'people'}.${'id'}
      LEFT JOIN ${'legalEntities'} AS le ON lep.${'legalEntityId'} = le.${'id'}
      LEFT JOIN ${'clientPeople'} AS cp ON cp.${'personId'} = ${'people'}.${'id'}
      LEFT JOIN ${'clients'} AS c ON cp.${'clientId'} = c.${'id'}
      WHERE 
        ${searchQuery(search)} AND 
        (${whereClientKeys({ keys: clientKeys })} OR 
         ${whereLegalEntityKeys({ keys: legalEntityKeys })})
      ORDER BY ${'people'}.${'lastName'} ${db.raw(sortDirection)}
      OFFSET ${db.param(offset)}
      LIMIT ${db.param(limit)}
    `.run(txOrPool);
    const count = await countPeople(search, txOrPool);

    return { people: people.map(withName), metadata: { count }};
  };

  const searchWorkers =  async (search: SearchOptions, meta: QueryOptions, txOrPool: TxOrPool = pool) =>
    searchPeople({ ...search, classifier: Classifier.Worker }, meta, txOrPool); 

  const searchContractors =  async (search: SearchOptions, meta: QueryOptions, txOrPool: TxOrPool = pool) =>
    searchPeople({ ...search, classifier: Classifier.Contractor }, meta, txOrPool); 

  const searchEmployees =  async (search: SearchOptions, meta: QueryOptions, txOrPool: TxOrPool = pool) =>
    searchPeople({ ...search, classifier: Classifier.Employee }, meta, txOrPool); 

  const getPerson = async ({ id }: IdProp, txOrPool: TxOrPool = pool) => {
    const clientKeys = extractKeys(u, "securityGroup", "client");
    const legalEntityKeys = extractKeys(u, "securityGroup", "legalEntity");

    const [ person ] = await db.sql<peopleSQL, s.people.Selectable[]>`
      SELECT ${'people'}.*, c.name AS client, le.name AS "legalEntity", c.id AS "clientId", le.id AS "legalEntityId" 
      FROM ${'people'}
      LEFT JOIN ${'legalEntityPeople'} AS lep ON lep.${'personId'} = ${'people'}.${'id'}
      LEFT JOIN ${'legalEntities'} AS le ON lep.${'legalEntityId'} = le.${'id'}
      LEFT JOIN ${'clientPeople'} AS cp ON cp.${'personId'} = ${'people'}.${'id'}
      LEFT JOIN ${'clients'} AS c ON cp.${'clientId'} = c.${'id'}
      WHERE 
        (${'people'}.${'id'} = ${db.param(id)} OR LOWER(${'people'}.${'identifier'}) = ${db.param(id.toLowerCase())}) AND
        (${whereClientKeys({ keys: clientKeys })} OR 
         ${whereLegalEntityKeys({ keys: legalEntityKeys })})
    `.run(txOrPool);

    return withName(person);
  };

  return {
    addPerson,
    addWorker,
    addContractor,
    addEmployee,
    updatePerson,
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