import type * as s from 'zapatos/schema';
import * as db from 'zapatos/db';
import pool from '../db.server';

import { ASC, DESC } from '../types';

export type Milestone = s.milestones.Selectable;
export type MilestoneSet = s.milestoneSets.Selectable & { milestones: Array<Milestone>};

const service = () => {
  const addMilestoneSet = async (milestoneSet: s.milestoneSets.Insertable) => {
    const [inserted] = await db.sql<s.milestoneSets.SQL, s.milestoneSets.Selectable[]>`
      INSERT INTO ${'milestoneSets'} (${db.cols(milestoneSet)})
      VALUES (${db.vals(milestoneSet)}) RETURNING *`.run(pool);

    return inserted;
  };

  const getMilestoneSetById = async ({ id }: { id: number | string }) => {
    const numericId = isNaN(parseInt(id as string)) ? 0 : id;

    const [ milestoneSet ] = await db.sql<s.milestoneSets.SQL, s.milestoneSets.Selectable[]>`
      SELECT * FROM ${'milestoneSets'} 
      WHERE ${'id'} = ${db.param(numericId)} OR LOWER(${'identifier'}) = ${db.param(id.toString().toLowerCase())}`
      .run(pool);
    return milestoneSet;
  };

  const getMilestonesBySet = async ({ setId }: { setId: number }) => {
    return await db.sql<s.milestones.SQL, s.milestones.Selectable[]>`
      SELECT * FROM ${'milestones'} 
      WHERE ${{setId}}`.run(pool);
  };

  const listMilestoneSets = async () => {
    return db.select('milestoneSets', db.all, {
      lateral: {
        milestones: db.select('milestones', { setId: db.parent('id' )})
      },
      order: [ { by: 'isDefault', direction: ASC }]
    }).run(pool);
  };

  return {
    addMilestoneSet,
    getMilestoneSetById,
    getMilestonesBySet,
    listMilestoneSets,
  };
};

export default service;
