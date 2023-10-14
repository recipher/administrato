import type * as s from 'zapatos/schema';
import * as db from 'zapatos/db';
import pool from '../db.server';

import type { SearchOptions, QueryOptions, TxOrPool } from '../types';
import { ASC, DESC } from '../types';

import { type User } from '../access/users.server';

import { whereKeys, extractKeys } from './shared.server';
import { whereLegalEntityKeys, whereClientKeys } from './people.server';

const Service = (u: User) => {
  const searchProviders = (search: SearchOptions) => {  
    const searchQuery = ({ search }: SearchOptions) => {
      return search == null ? db.sql<db.SQL>`main.${'name'} IS NOT NULL` : db.sql<db.SQL>`
        LOWER(main.${'name'}) LIKE LOWER(${db.param(`${search}%`)})`;
    };

    const keys = extractKeys(u, "serviceCentre", "provider");

    return db.sql<s.providers.SQL, s.providers.Selectable[]>`
      SELECT main.${'id'}, main.${'name'}, main.${'logo'} AS image, 'provider' AS type, NULL AS "parentType" 
      FROM ${'providers'} AS main
      WHERE ${searchQuery(search)} AND ${whereKeys({ keys })}`;
  };

  const searchPeople = (search: SearchOptions) => {  
    const searchQuery = ({ search }: SearchOptions) => {
      return search == null ? db.sql<db.SQL>`${'lastName'} IS NOT NULL` : db.sql<db.SQL>`
        (LOWER(${'people'}.${'firstName'}) LIKE LOWER(${db.param(`${search}%`)}) OR
         LOWER(${'people'}.${'lastName'}) LIKE LOWER(${db.param(`${search}%`)}))`;  
    };

    const clientKeys = extractKeys(u, "serviceCentre", "client");
    const legalEntityKeys = extractKeys(u, "serviceCentre", "legalEntity");

    return db.sql<s.people.SQL | s.legalEntities.SQL | s.clients.SQL, s.people.Selectable[]>`
      SELECT ${'people'}.id, CONCAT(${'people'}."firstName", ' ', ${'people'}."lastName") AS name, ${'people'}.${'photo'} AS image, classifier AS type, 'people' AS "parentType"
      FROM ${'people'}
      WHERE 
        ${searchQuery(search)} AND 
        (${whereClientKeys({ keys: clientKeys })} OR 
         ${whereLegalEntityKeys({ keys: legalEntityKeys })})`;
    };

  const searchClients = (search: SearchOptions) => {  
    const searchQuery = ({ search }: SearchOptions) => {
      return search == null ? db.sql<db.SQL>`` : db.sql<db.SQL>`
        AND 
          LOWER(main.${'name'}) LIKE LOWER(${db.param(`${search}%`)})`;
    };
  
    const keys = extractKeys(u, "serviceCentre", "client");
    return db.sql<s.clients.SQL, s.clients.Selectable[]>`
      SELECT main.${'id'}, main.${'name'}, main.${'logo'} AS image, 'client' AS type, NULL AS "parentType"
      FROM ${'clients'} AS main
      WHERE main.${'parentId'} IS NULL ${searchQuery(search)} AND ${whereKeys({ keys })}`;
  };

  const searchLegalEntities = (search: SearchOptions) => {  
    const searchQuery = ({ search }: SearchOptions) => {
      return search == null ? db.sql<db.SQL>`main.${'name'} IS NOT NULL` : db.sql<db.SQL>`
        LOWER(main.${'name'}) LIKE LOWER(${db.param(`${search}%`)})`;
    };

    const keys = extractKeys(u, "serviceCentre", "legalEntity");

    return db.sql<s.legalEntities.SQL | s.providers.SQL, s.legalEntities.Selectable[]>`
      SELECT main.${'id'}, main.${'name'}, main.${'logo'} AS image, 'legal-entity' AS type, NULL AS "parentType" 
      FROM ${'legalEntities'} AS main
      WHERE ${searchQuery(search)} AND ${whereKeys({ keys })}`
    };

  const search = (search: SearchOptions, { offset = 0, limit = 8, sortDirection = ASC }: QueryOptions, txOrPool: TxOrPool = pool) => {
    const clients = searchClients(search);
    const people = searchPeople(search);
    const providers = searchProviders(search);
    const legalEntities = searchLegalEntities(search);

    if (sortDirection == null || (sortDirection !== ASC && sortDirection !== DESC)) sortDirection = ASC;

    return db.sql`
      ${clients} 
      UNION ALL 
      ${people}
      UNION ALL 
      ${providers}
      UNION ALL 
      ${legalEntities}
      ORDER BY ${'name'} ${db.raw(sortDirection)}
      OFFSET ${db.param(offset)}
      LIMIT ${db.param(limit)}
    `.run(txOrPool);
  };

  return { search };
}

export default Service;