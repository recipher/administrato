import type * as s from 'zapatos/schema';
import * as db from 'zapatos/db';
import pool from './db.server';

export type ServiceCentre = s.serviceCentres.Selectable;

export const addServiceCentre = async (serviceCentre: s.serviceCentres.Insertable) => {
  const [inserted] = await db.sql<s.serviceCentres.SQL, s.serviceCentres.Selectable[]>`
    INSERT INTO ${'serviceCentres'} (${db.cols(serviceCentre)})
    VALUES (${db.vals(serviceCentre)}) RETURNING *`.run(pool);

  return inserted;
};

export const listServiceCentres = async () => {
  return await db.sql<s.serviceCentres.SQL, s.serviceCentres.Selectable[]>`
    SELECT * FROM ${'serviceCentres'}`.run(pool);
};
