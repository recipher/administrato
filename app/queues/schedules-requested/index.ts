import LegalEntityService from '../../services/manage/legal-entities.server';
import { type Schedulable } from '../../services/scheduler/schedules.server';
import arc from '@architect/functions';

export async function handler (event: any) {
  await Promise.all(event.Records.map(async ({ body }: { body: any }) => {
    const { schedulables, start, end, meta: { user }} = JSON.parse(body);

    const service = LegalEntityService(user);

    const keys = schedulables.map(({ keyStart, keyEnd }: Schedulable) => 
      ({ keyStart, keyEnd }));

    const legalEntities = await service.listLegalEntities({ keys });
    
    legalEntities.forEach(({ id: legalEntityId }) => {
      arc.queues.publish({
        name: 'schedule-requested',
        payload: { legalEntityId, start, end, meta: { user }} 
      });
    });
  }));
};