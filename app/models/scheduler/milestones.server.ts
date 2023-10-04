import type * as s from 'zapatos/schema';
import * as db from 'zapatos/db';
import pool from '../db.server';

export { default as create } from '../id.server';

import { type User } from '../access/users.server';
import { ASC } from '../types';

type TxOrPool = { txOrPool?: typeof pool | db.TxnClientForSerializable };

export type Milestone = s.milestones.Selectable;
export type MilestoneSet = s.milestoneSets.Selectable & { milestones: Array<Milestone>};

const service = (u: User) => {
  const addMilestoneSet = async (milestoneSet: s.milestoneSets.Insertable) => {
    const [inserted] = await db.sql<s.milestoneSets.SQL, s.milestoneSets.Selectable[]>`
      INSERT INTO ${'milestoneSets'} (${db.cols(milestoneSet)})
      VALUES (${db.vals(milestoneSet)}) RETURNING *
    `.run(pool);

    return inserted;
  };

  const addMilestone = async (milestone: s.milestones.Insertable) => {
    const latest = await getLatestMilestonesForSet({ setId: milestone.setId as string })

    milestone.index = latest === undefined ? 0 : (latest.index || 0) + 1;
    milestone.identifier = (milestone.identifier as string)
      .replace(/([a-z])([A-Z])/g, "$1-$2")
      .replace(/[\s_]+/g, '-')
      .toLowerCase();

    return db.serializable(pool, async tx => {
      if (milestone.pivot) await db.sql<s.milestones.SQL, s.milestones.Selectable[]>`
        UPDATE ${'milestones'} 
        SET ${'pivot'} = FALSE, ${'updatedAt'} = now() 
        WHERE ${'setId'} = ${db.param(milestone.setId)}
      `.run(tx);

      const [inserted] = await db.sql<s.milestones.SQL, s.milestones.Selectable[]>`
        INSERT INTO ${'milestones'} (${db.cols(milestone)})
        VALUES (${db.vals(milestone)}) RETURNING *
      `.run(tx);

      return inserted;
    });
  };

  const getMilestoneSetById = async ({ id }: { id: string }) => {
    const [ milestoneSet ] = await db.sql<s.milestoneSets.SQL, s.milestoneSets.Selectable[]>`
      SELECT * FROM ${'milestoneSets'} 
      WHERE ${'id'} = ${db.param(id)} OR LOWER(${'identifier'}) = ${db.param(id.toLowerCase())}
    `.run(pool);
    return milestoneSet;
  };

  const getDefaultSet = async () => {
    return db.sql<s.milestones.SQL | s.milestoneSets.SQL, s.milestones.Selectable[]>`
      SELECT * FROM ${'milestones'} 
      LEFT JOIN ${'milestoneSets'} ON ${'milestoneSets'}${'id'} = ${'milestones'}.${'setId'}
      WHERE ${'milestoneSets'}.${'isDefault'} = TRUE
      ORDER BY ${'index'} ASC
    `.run(pool);
  };

  const getMilestonesBySet = async ({ setId }: { setId: string }) => {
    return db.sql<s.milestones.SQL, s.milestones.Selectable[]>`
      SELECT * FROM ${'milestones'} 
      WHERE ${{setId}}
      ORDER BY ${'index'} ASC
    `.run(pool);
  };

  const getMilestonesBySetAboveIndex = async ({ setId, index, txOrPool = pool }: { setId: string, index: number } & TxOrPool) => {
    return db.sql<s.milestones.SQL, s.milestones.Selectable[]>`
      SELECT * FROM ${'milestones'} 
      WHERE ${{setId}} AND ${'index'} > ${db.param(index)}
      ORDER BY ${'index'} ASC
    `.run(txOrPool);
  };

  const removeMilestone = async ({ id }: { id: string }) => {
    return db.serializable(pool, async tx => {
      const [ milestone ] = await db.sql<s.milestones.SQL, s.milestones.Selectable[]>`
        SELECT * FROM ${'milestones'} 
        WHERE ${{id}}
      `.run(tx);

      if (milestone === undefined) throw Error('Milestone not found');
console.log(milestone)
      if (milestone.pivot) await db.sql<s.milestones.SQL>`
        UPDATE ${'milestones'} 
        SET ${'pivot'} = TRUE, ${'updatedAt'} = now() 
        WHERE ${'id'} = (
          SELECT ${'id'} 
          FROM ${'milestones'}
          WHERE ${'setId'} = ${db.param(milestone.setId)}
          ORDER BY ${'index'} DESC
          LIMIT 1
        )
      `.run(tx);

      await reindexAbove({ ...milestone, txOrPool: tx });

      return db.sql<s.milestones.SQL>`
        DELETE FROM ${'milestones'} WHERE ${{id}}
      `.run(tx);
    });
  };

  const updateMilestoneIndex = async ({ id, index, txOrPool = pool }: { id: string, index: number } & TxOrPool) => {
    return db.sql<s.milestones.SQL>`
      UPDATE ${'milestones'} 
      SET ${'index'} = ${db.param(index)}, ${'updatedAt'} = now()
      WHERE ${'id'} = ${db.param(id)}
    `.run(txOrPool)
  };

  const reindexAbove = async ({ setId, index, txOrPool = pool }: Milestone & TxOrPool) => {
    if (index === null) return;
    const milestones = await getMilestonesBySetAboveIndex({ setId, index, txOrPool });

    await Promise.all(milestones.map(({ id, index: i }: Milestone) =>
      updateMilestoneIndex({ id, index: (i || 0)-1, txOrPool })
    ));
  };

  const swapIndexes = async ({ first, second, txOrPool = pool }: { first: Milestone, second: Milestone } & TxOrPool) => {
    await updateMilestoneIndex({ id: first.id, index: Number(second.index), txOrPool });
    await updateMilestoneIndex({ id: second.id, index: Number(first.index), txOrPool });
  };

  const increaseMilestoneIndex = async ({ id, txOrPool = pool }: { id: string } & TxOrPool) => {
    return db.serializable(txOrPool, async tx => {
      const [ milestone ] = await db.sql<s.milestones.SQL, s.milestones.Selectable[]>`
        SELECT * FROM ${'milestones'} 
        WHERE ${{id}}
      `.run(tx);

      if (milestone === undefined) throw Error('Milestone not found');

      const { setId, index } = milestone;

      const [ next ] = await db.sql<s.milestones.SQL, s.milestones.Selectable[]>`
        SELECT * FROM ${'milestones'} 
        WHERE ${{setId}} AND ${'index'} > ${db.param(index)}
        ORDER BY ${'index'} ASC
      `.run(tx);

      if (next === undefined) throw Error('Maximum index reached');

      return swapIndexes({ first: milestone, second: next, txOrPool: tx });
    });
  };

  const decreaseMilestoneIndex = async ({ id, txOrPool = pool }: { id: string } & TxOrPool) => {
    return db.serializable(txOrPool, async tx => {
      const [ milestone ] = await db.sql<s.milestones.SQL, s.milestones.Selectable[]>`
        SELECT * FROM ${'milestones'} 
        WHERE ${{id}}
      `.run(tx);

      if (milestone === undefined) throw Error('Milestone not found');

      const { setId, index } = milestone;

      const [ previous ] = await db.sql<s.milestones.SQL, s.milestones.Selectable[]>`
        SELECT * FROM ${'milestones'} 
        WHERE ${{setId}} AND ${'index'} < ${db.param(index)}
        ORDER BY ${'index'} DESC
      `.run(tx);

      if (previous === undefined) throw Error('Minimum index reached');

      return swapIndexes({ first: milestone, second: previous, txOrPool: tx });
    });
  };

  const getLatestMilestonesForSet = async ({ setId }: { setId: string }) => {
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
    getDefaultSet,
    removeMilestone,
    increaseMilestoneIndex,
    decreaseMilestoneIndex,
    listMilestoneSets,
  };
};

export default service;
