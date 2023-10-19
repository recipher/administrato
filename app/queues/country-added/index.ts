import HolidaysService from '../../services/scheduler/holidays.server';

export async function handler (event: any) {
  const year = new Date().getUTCFullYear();

  await Promise.all(event.Records.map(async ({ body }: { body: any }) => {
    const { country, regions, meta: { user }} = JSON.parse(body);

    const sync = async (locality: string, year: number) => {
      const service = HolidaysService(user);
      await service.syncHolidays({ year, locality }, { shouldDelete: true });
    };
    
    await sync(country, year);
    return Promise.all(regions.map((region: string) => sync(region, year)));
  }));

  return event;
};