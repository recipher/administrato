import type * as s from 'zapatos/schema';
import * as db from 'zapatos/db';
import pool from '../db.server';

export { default as create } from '../id.server';

import { type User } from '../access/users.server';
import { ASC, DESC, QueryOptions } from '../types';

import LegalEntityService, { type LegalEntity } from '../manage/legal-entities.server';
import ClientService from '../manage/clients.server';
import SecurityGroupService from '../manage/security-groups.server';
import ProviderService from '../manage/providers.server';

import { TxOrPool } from '../types';

export type Milestone = s.milestones.Selectable;
export type MilestoneSet = s.milestoneSets.Selectable & { milestones: Array<Milestone>};

const Service = (u: User) => {
  const addMilestoneSet = async (data: s.milestoneSets.Insertable, txOrPool: TxOrPool = pool) => {
    const milestoneSet = { ...data, createdBy: u };
    const [ inserted ] = await db.sql<s.milestoneSets.SQL, s.milestoneSets.Selectable[]>`
      INSERT INTO ${'milestoneSets'} (${db.cols(milestoneSet)})
      VALUES (${db.vals(milestoneSet)}) RETURNING *
    `.run(txOrPool);

    return inserted;
  };

  const addMilestone = async (data: s.milestones.Insertable, txOrPool: TxOrPool = pool) => {
    const milestone = { ...data, createdBy: u };

    return db.serializable(txOrPool, async tx => {
      const latest = await getLatestMilestonesForSet({ setId: milestone.setId as string }, tx)

      milestone.index = latest === undefined ? 0 : (latest.index || 0) + 1;
      milestone.identifier = (milestone.identifier as string)
        .replace(/([a-z])([A-Z])/g, "$1-$2")
        .replace(/[\s_]+/g, '-')
        .toLowerCase();

      if (milestone.target) await db.sql<s.milestones.SQL, s.milestones.Selectable[]>`
        UPDATE ${'milestones'} 
        SET ${'target'} = FALSE, ${'updatedAt'} = now() 
        WHERE ${'setId'} = ${db.param(milestone.setId)}
      `.run(tx);

      const [ inserted ] = await db.sql<s.milestones.SQL, s.milestones.Selectable[]>`
        INSERT INTO ${'milestones'} (${db.cols(milestone)})
        VALUES (${db.vals(milestone)}) RETURNING *
      `.run(tx);

      return inserted;
    });
  };

  const getMilestoneSetById = async ({ id }: { id: string }, txOrPool: TxOrPool = pool) => {
    const [ milestoneSet ] = await db.sql<s.milestoneSets.SQL, s.milestoneSets.Selectable[]>`
      SELECT * FROM ${'milestoneSets'} 
      WHERE ${'id'} = ${db.param(id)} OR 
            LOWER(${'identifier'}) = ${db.param(id.toLowerCase())}
    `.run(txOrPool);
    return milestoneSet;
  };

  const getDefaultMilestoneSet = async (txOrPool: TxOrPool = pool) => {
    const [ milestoneSet ] = await db.sql<s.milestoneSets.SQL, s.milestoneSets.Selectable[]>`
      SELECT * FROM ${'milestoneSets'} 
      ORDER BY ${'isDefault'} DESC
      LIMIT 1
    `.run(txOrPool);
    return milestoneSet;
  };

  const listMilestonesByDefaultSet = async ({ sortDirection }: QueryOptions = { sortDirection: DESC }, txOrPool: TxOrPool = pool) => {
    if (sortDirection == null) sortDirection = DESC;
    const milestones = await db.sql<s.milestones.SQL | s.milestoneSets.SQL, s.milestones.Selectable[]>`
      SELECT ${'milestones'}.* FROM ${'milestones'} 
      LEFT JOIN ${'milestoneSets'} ON ${'milestoneSets'}.${'id'} = ${'milestones'}.${'setId'}
      WHERE ${'milestoneSets'}.${'isDefault'} = TRUE
      ORDER BY ${'index'} ${db.raw(sortDirection)}
    `.run(txOrPool);

    if (milestones.length) return milestones;

    return db.sql<s.milestones.SQL | s.milestoneSets.SQL, s.milestones.Selectable[]>`
      SELECT ${'milestones'}.* FROM ${'milestones'} 
      WHERE ${'setId'} = (
        SELECT ${'id'} 
        FROM ${'milestoneSets'} 
        LIMIT 1
      )
      ORDER BY ${'index'} ${db.raw(sortDirection)}
    `.run(txOrPool);
  };

  const listMilestonesBySet = async ({ setId }: { setId: string }, { sortDirection }: QueryOptions = { sortDirection: DESC }, txOrPool: TxOrPool = pool) => {
    if (sortDirection == null) sortDirection = DESC;
    return db.sql<s.milestones.SQL, s.milestones.Selectable[]>`
      SELECT * FROM ${'milestones'} 
      WHERE ${{setId}}
      ORDER BY ${'index'} ${db.raw(sortDirection)}
    `.run(txOrPool);
  };

  const getMilestoneSetByIdOrDefault = async ({ id }: { id: string | null }) => {
    return id === null ? getDefaultMilestoneSet() : getMilestoneSetById({ id });
  };

  const listMilestonesBySetOrDefault = async ({ setId }: { setId: string | null }, options: QueryOptions = {}, txOrPool: TxOrPool = pool) => {
    return setId === null ? listMilestonesByDefaultSet(options, txOrPool) : listMilestonesBySet({ setId }, options, txOrPool);
  };

  const listMilestonesForLegalEntity = async ({ legalEntity }: { legalEntity: LegalEntity }, options: QueryOptions = {}, txOrPool: TxOrPool = pool) => {
      const { milestoneSetId: setId } = legalEntity;
    const milestones = await listMilestonesBySetOrDefault({ setId }, options, txOrPool);
    if (milestones.length === 0) throw new Error('No milestones found');
    return milestones;
  };

  const listMilestonesForLegalEntityId = async ({ legalEntityId: id }: { legalEntityId: string }, options: QueryOptions = {}, txOrPool: TxOrPool = pool) => {
    const legalEntity = await LegalEntityService(u).getLegalEntity({ id }, { bypassKeyCheck: false }, txOrPool);
    return listMilestonesForLegalEntity({ legalEntity }, options, txOrPool);
  };

  const getMilestonesBySetAboveIndex = async ({ setId, index }: { setId: string, index: number }, txOrPool: TxOrPool = pool) => {
    return db.sql<s.milestones.SQL, s.milestones.Selectable[]>`
      SELECT * FROM ${'milestones'} 
      WHERE ${{setId}} AND ${'index'} > ${db.param(index)}
      ORDER BY ${'index'} ASC
    `.run(txOrPool);
  };

  const removeMilestone = async ({ id }: { id: string }, txOrPool: TxOrPool = pool) => {
    return db.serializable(txOrPool, async tx => {
      const [ milestone ] = await db.sql<s.milestones.SQL, s.milestones.Selectable[]>`
        SELECT * FROM ${'milestones'} 
        WHERE ${{id}}
      `.run(tx);

      if (milestone === undefined) throw Error('Milestone not found');

      if (milestone.target) await db.sql<s.milestones.SQL, s.milestoneSets.Selectable[]>`
        UPDATE ${'milestones'} 
        SET ${'target'} = TRUE, ${'updatedAt'} = now() 
        WHERE ${'id'} = (
          SELECT ${'id'} 
          FROM ${'milestones'}
          WHERE ${'setId'} = ${db.param(milestone.setId)} AND
                ${'id'} != ${db.param(milestone.id)}
          ORDER BY ${'index'} DESC
          LIMIT 1
        ) RETURNING *
      `.run(tx);

      await reindexAbove(milestone, tx);

      return db.sql<s.milestones.SQL>`
        DELETE FROM ${'milestones'} WHERE ${{id}}
      `.run(tx);
    });
  };

  const updateMilestoneIndex = async ({ id, index }: { id: string, index: number }, txOrPool: TxOrPool = pool) => {
    return db.sql<s.milestones.SQL>`
      UPDATE ${'milestones'} 
      SET ${'index'} = ${db.param(index)}, ${'updatedBy'} = ${db.param(u)}, 
      WHERE ${'id'} = ${db.param(id)}
    `.run(txOrPool)
  };

  const reindexAbove = async ({ setId, index }: Milestone, txOrPool: TxOrPool = pool) => {
    if (index === null) return;
    const milestones = await getMilestonesBySetAboveIndex({ setId, index }, txOrPool);

    await Promise.all(milestones.map(({ id, index: i }: Milestone) =>
      updateMilestoneIndex({ id, index: (i || 0)-1 }, txOrPool)
    ));
  };

  const swapIndexes = async (first: Milestone, second: Milestone, txOrPool: TxOrPool = pool) => {
    await updateMilestoneIndex({ id: first.id, index: Number(second.index) }, txOrPool);
    await updateMilestoneIndex({ id: second.id, index: Number(first.index) }, txOrPool);
  };

  const increaseMilestoneIndex = async ({ id }: { id: string }, txOrPool: TxOrPool = pool) => {
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

      return swapIndexes(milestone, next, txOrPool);
    });
  };

  const decreaseMilestoneIndex = async ({ id }: { id: string }, txOrPool: TxOrPool = pool) => {
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

      return swapIndexes(milestone, previous, txOrPool);
    });
  };

  const getLatestMilestonesForSet = async ({ setId }: { setId: string }, txOrPool: TxOrPool = pool) => {
    const milestones = await listMilestonesBySet({ setId }, undefined, txOrPool);
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

  const getCountriesForMilestone = async ({ milestone, legalEntityId }: { milestone: Milestone, legalEntityId: string }, txOrPool: TxOrPool = pool) => {
    const legalEntity = await LegalEntityService(u).getLegalEntity({ id: legalEntityId });
    
    const entities = await Promise.all((milestone.entities || []).map(async entity => {
      if (entity === "legal-entity") return legalEntity;
      if (entity === "security-group") // TODO fix this
        return legalEntity.securityGroupId
          ? SecurityGroupService(u).getSecurityGroup({ id: legalEntity.securityGroupId }, { bypassKeyCheck: false }, txOrPool)
          : legalEntity.clientId 
            ? SecurityGroupService(u).getSecurityGroup({ id: (await ClientService(u).getClient({ id: legalEntity.clientId }, { bypassKeyCheck: false }, txOrPool)).securityGroupId })
            : undefined;
      if (entity === "provider" && legalEntity.providerId !== null)
        return ProviderService(u).getProvider({ id: legalEntity.providerId }, { bypassKeyCheck: false }, txOrPool);
      if (entity === "client" && legalEntity.clientId !== null)
        return ClientService(u).getClient({ id: legalEntity.clientId }, { bypassKeyCheck: false }, txOrPool);
    }));

    return entities.map(entity => {
      if (entity === undefined) return;
      return { id: entity.id, countries: entity.localities?.flat().reduce((countries: string[], country) => 
        country == null ? countries : [ ...countries, country ], []) 
      };
    }).reduce((data: any, item) => item === undefined ? data : [ ...data, item ], []);
  };

  return {
    addMilestone,
    addMilestoneSet,
    getMilestoneSetById,
    getMilestoneSetByIdOrDefault,
    listMilestonesBySet,
    listMilestonesByDefaultSet,
    listMilestonesBySetOrDefault,
    listMilestonesForLegalEntity,
    listMilestonesForLegalEntityId,
    removeMilestone,
    increaseMilestoneIndex,
    decreaseMilestoneIndex,
    listMilestoneSets,
    getCountriesForMilestone,
  };
};

export default Service;
