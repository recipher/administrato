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

  const addMilestone = async (milestone: s.milestones.Insertable) => {
    const latest = await getLatestMilestonesForSet({ setId: Number(milestone.setId) })

    milestone.index = latest === undefined ? 0 : (latest.index || 0) + 1;
    milestone.identifier = milestone.identifier.toString()
      .replace(/([a-z])([A-Z])/g, "$1-$2")
      .replace(/[\s_]+/g, '-')
      .toLowerCase();

    if (milestone.pivot) await db.sql<s.milestones.SQL, s.milestones.Selectable[]>`
      UPDATE ${'milestones'} SET ${'pivot'} = FALSE WHERE ${'setId'} = ${db.param(milestone.setId)}
    `.run(pool);

    const [inserted] = await db.sql<s.milestones.SQL, s.milestones.Selectable[]>`
      INSERT INTO ${'milestones'} (${db.cols(milestone)})
      VALUES (${db.vals(milestone)}) RETURNING *`.run(pool);

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
      WHERE ${{setId}}
      ORDER BY ${'index'} ASC
    `.run(pool);
  };

  const getMilestonesBySetAboveIndex = async ({ setId, index }: { setId: number, index: number }) => {
    return await db.sql<s.milestones.SQL, s.milestones.Selectable[]>`
      SELECT * FROM ${'milestones'} 
      WHERE ${{setId}} AND ${'index'} > ${db.param(index)}
      ORDER BY ${'index'} ASC
    `.run(pool);
  };

  const removeMilestone = async ({ id }: { id: number }) => {
    const [ milestone ] = await db.sql<s.milestones.SQL, s.milestones.Selectable[]>`
      SELECT * FROM ${'milestones'} 
      WHERE ${{id}}`.run(pool);

    if (milestone === undefined) throw Error('Milestone not found');

    await reindexAbove(milestone);

    return db.sql<s.milestones.SQL, s.milestones.Selectable[]>`
      DELETE FROM ${'milestones'} WHERE ${{id}}`.run(pool);
  };

  const updateMilestoneIndex = async ({ id, index }: { id: number, index: number }) => {
    return db.sql<s.milestones.SQL, s.milestones.Selectable[]>`
      UPDATE ${'milestones'} SET ${'index'} = ${db.param(index)} 
      WHERE ${'id'} = ${db.param(id)}`.run(pool)
  };

  const reindexAbove = async ({ setId, index }: Milestone) => {
    if (index === null) return;
    const milestones = await getMilestonesBySetAboveIndex({ setId: Number(setId), index });

    await Promise.all(milestones.map(({ id, index: i }: Milestone) =>
      updateMilestoneIndex({ id: Number(id), index: (i || 0)-1 })
    ));
  };

  const swapIndexes = async (first: Milestone, second: Milestone) => {
    await updateMilestoneIndex({ id: Number(first.id), index: Number(second.index) });
    await updateMilestoneIndex({ id: Number(second.id), index: Number(first.index) });
  };

  const increaseMilestoneIndex = async ({ id }: { id: number }) => {
    const [ milestone ] = await db.sql<s.milestones.SQL, s.milestones.Selectable[]>`
      SELECT * FROM ${'milestones'} 
      WHERE ${{id}}`.run(pool);

    if (milestone === undefined) throw Error('Milestone not found');

    const { setId, index } = milestone;

    const [ next ] = await db.sql<s.milestones.SQL, s.milestones.Selectable[]>`
      SELECT * FROM ${'milestones'} 
      WHERE ${{setId}} AND ${'index'} > ${db.param(index)}
      ORDER BY ${'index'} ASC`.run(pool);

    if (next === undefined) throw Error('Maximum index reached');

    return swapIndexes(milestone, next);
  };

  const decreaseMilestoneIndex = async ({ id }: { id: number }) => {
    const [ milestone ] = await db.sql<s.milestones.SQL, s.milestones.Selectable[]>`
      SELECT * FROM ${'milestones'} 
      WHERE ${{id}}`.run(pool);

    if (milestone === undefined) throw Error('Milestone not found');

    const { setId, index } = milestone;

    const [ previous ] = await db.sql<s.milestones.SQL, s.milestones.Selectable[]>`
      SELECT * FROM ${'milestones'} 
      WHERE ${{setId}} AND ${'index'} < ${db.param(index)}
      ORDER BY ${'index'} DESC`.run(pool);

    if (previous === undefined) throw Error('Minimum index reached');

    return swapIndexes(milestone, previous);
  };

  const getLatestMilestonesForSet = async ({ setId }: { setId: number }) => {
    const milestones = await getMilestonesBySet({ setId });
    if (milestones.length === 0) return;

    return milestones.reduce((latest: Milestone, milestone: Milestone) =>
      latest === null || ((latest.index || 0) < (milestone.index || 0)) ? milestone : latest
    );
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
    addMilestone,
    addMilestoneSet,
    getMilestoneSetById,
    getMilestonesBySet,
    removeMilestone,
    increaseMilestoneIndex,
    decreaseMilestoneIndex,
    listMilestoneSets,
  };
};

export default service;
