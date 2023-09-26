import type * as s from 'zapatos/schema';
import * as db from 'zapatos/db';
import pool from '../db.server';

import type { SearchOptions, QueryOptions } from '../types';
import { ASC, DESC } from '../types';

import { type User } from '../access/users.server';

import { whereKeys, extractKeys } from './shared.server';
import { whereLegalEntityKeys, whereClientKeys } from './workers.server';

const service = (u: User) => {

  const searchWorkers = (search: SearchOptions, { offset = 0, limit = 8, sortDirection = ASC }: QueryOptions) => {  
    const searchQuery = ({ search }: SearchOptions) => {
      return search == null ? db.sql<db.SQL>`${'lastName'} IS NOT NULL` : db.sql<db.SQL>`
        (LOWER(${'workers'}.${'firstName'}) LIKE LOWER(${db.param(`${search}%`)}) OR
         LOWER(${'workers'}.${'lastName'}) LIKE LOWER(${db.param(`${search}%`)}))`;  
    };

    const clientKeys = extractKeys(u, "serviceCentre", "client");
    const legalEntityKeys = extractKeys(u, "serviceCentre", "legalEntity");
    if (sortDirection == null || (sortDirection !== ASC && sortDirection !== DESC)) sortDirection = ASC;

    return db.sql<s.workers.SQL | s.legalEntities.SQL | s.clients.SQL, s.workers.Selectable[]>`
      SELECT ${'workers'}.id, ${'workers'}."firstName" AS name, 'worker' AS type FROM ${'workers'}
      LEFT JOIN ${'legalEntities'} AS le ON ${'workers'}.${'legalEntityId'} = le.${'id'}
      LEFT JOIN ${'clients'} AS c ON ${'workers'}.${'clientId'} = c.${'id'}
      WHERE 
        ${searchQuery(search)} AND 
        (${whereClientKeys({ keys: clientKeys })} OR 
         ${whereLegalEntityKeys({ keys: legalEntityKeys })})
      `;
    };

  const searchClients = (search: SearchOptions, { offset = 0, limit = 8, sortDirection = ASC }: QueryOptions) => {  
    const searchQuery = ({ search }: SearchOptions) => {
      return search == null ? db.sql<db.SQL>`` : db.sql<db.SQL>`
        AND 
          LOWER(main.${'name'}) LIKE LOWER(${db.param(`${search}%`)})`;
    };
  
    const keys = extractKeys(u, "serviceCentre", "client");
    if (sortDirection == null || (sortDirection !== ASC && sortDirection !== DESC)) sortDirection = ASC;

    return db.sql<s.clients.SQL, s.clients.Selectable[]>`
      SELECT main.id, main.name, 'client' AS type FROM ${'clients'} AS main
      WHERE main.${'parentId'} IS NULL ${searchQuery(search)} AND ${whereKeys({ keys })}
      `;
  };

  const search = (search: SearchOptions, options: QueryOptions) => {
    const clients = searchClients(search, options);
    const workers = searchWorkers(search, options);

    const query = db.sql`${clients} UNION ALL ${workers}`;

    return query.run(pool);
  };

  return { search };
}

export default service;