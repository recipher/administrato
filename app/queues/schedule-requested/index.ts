import ScheduleService from '../../services/scheduler/schedules.server';

export async function handler (event: any) {
  await Promise.all(event.Records.map(async ({ body }: { body: any }) => {
    const { legalEntityId, start, end, meta: { user }} = JSON.parse(body);

    await ScheduleService(user).generate(
      { legalEntityId, start: new Date(start), end: new Date(end) });
  }));
};