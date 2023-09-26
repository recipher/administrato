import type * as s from 'zapatos/schema';
import * as db from 'zapatos/db';
import pool from '../db.server';

import type { SearchOptions, QueryOptions } from '../types';
import { ASC, DESC } from '../types';

import { type User } from '../access/users.server';

import { whereKeys, extractKeys } from './shared.server';
import { whereLegalEntityKeys, whereClientKeys } from './workers.server';

const service = (u: User) => {
  const searchProviders = (search: SearchOptions) => {  
    const searchQuery = ({ search }: SearchOptions) => {
      return search == null ? db.sql<db.SQL>`main.${'name'} IS NOT NULL` : db.sql<db.SQL>`
        LOWER(main.${'name'}) LIKE LOWER(${db.param(`${search}%`)})`;
    };

    const keys = extractKeys(u, "serviceCentre", "provider");

    return db.sql<s.providers.SQL, s.providers.Selectable[]>`
      SELECT main.${'id'}, main.${'name'}, main.${'logo'} AS image, 'provider' AS type FROM ${'providers'} AS main
      WHERE ${searchQuery(search)} AND ${whereKeys({ keys })}`;
  };

  const searchWorkers = (search: SearchOptions) => {  
    const searchQuery = ({ search }: SearchOptions) => {
      return search == null ? db.sql<db.SQL>`${'lastName'} IS NOT NULL` : db.sql<db.SQL>`
        (LOWER(${'workers'}.${'firstName'}) LIKE LOWER(${db.param(`${search}%`)}) OR
         LOWER(${'workers'}.${'lastName'}) LIKE LOWER(${db.param(`${search}%`)}))`;  
    };

    const clientKeys = extractKeys(u, "serviceCentre", "client");
    const legalEntityKeys = extractKeys(u, "serviceCentre", "legalEntity");

    return db.sql<s.workers.SQL | s.legalEntities.SQL | s.clients.SQL, s.workers.Selectable[]>`
      SELECT ${'workers'}.id, CONCAT(${'workers'}."firstName", ' ', ${'workers'}."lastName") AS name, ${'workers'}.${'photo'} AS image, 'worker' AS type 
      FROM ${'workers'}
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
      SELECT main.${'id'}, main.${'name'}, main.${'logo'} AS image, 'client' AS type FROM ${'clients'} AS main
      WHERE main.${'parentId'} IS NULL ${searchQuery(search)} AND ${whereKeys({ keys })}`;
  };

  const searchLegalEntities = (search: SearchOptions) => {  
    const searchQuery = ({ search }: SearchOptions) => {
      return search == null ? db.sql<db.SQL>`main.${'name'} IS NOT NULL` : db.sql<db.SQL>`
        LOWER(main.${'name'}) LIKE LOWER(${db.param(`${search}%`)})`;
    };

    const keys = extractKeys(u, "serviceCentre", "legalEntity");

    return db.sql<s.legalEntities.SQL | s.providers.SQL, s.legalEntities.Selectable[]>`
      SELECT main.${'id'}, main.${'name'}, main.${'logo'} AS image, 'legal-entity' AS type 
      FROM ${'legalEntities'} AS main
      WHERE ${searchQuery(search)} AND ${whereKeys({ keys })}`
    };

  const search = (search: SearchOptions, { offset = 0, limit = 8, sortDirection = ASC }: QueryOptions) => {
    const clients = searchClients(search);
    const workers = searchWorkers(search);
    const providers = searchProviders(search);
    const legalEntities = searchLegalEntities(search);

    if (sortDirection == null || (sortDirection !== ASC && sortDirection !== DESC)) sortDirection = ASC;

    const query = db.sql`
      ${clients} 
      UNION ALL 
      ${workers}
      UNION ALL 
      ${providers}
      UNION ALL 
      ${legalEntities}
      ORDER BY ${'name'} ${db.raw(sortDirection)}`;

    return query.run(pool);
  };

  return { search };
}

export default service;