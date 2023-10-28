import type { LoaderFunction, LoaderArgs } from "@remix-run/node";
import { requireUser } from "~/auth/auth.server";
import { badRequest } from "~/utility/errors";

import CountryService from '~/services/countries.server';
import LegalEntityService from '~/services/manage/legal-entities.server';
import MilestoneService from '~/services/scheduler/milestones.server';
import ScheduleService, { Status } from '~/services/scheduler/schedules.server';
import ExcelService from '~/services/scheduler/excel.server';
import { type Holiday } from '~/services/scheduler/holidays.server';

export const loader: LoaderFunction = async ({ request, params }: LoaderArgs) => {
  const u = await requireUser(request);

  const { id } = params;
  if (id === undefined) return badRequest('Invalid request');
  
  const legalEntity = await LegalEntityService(u).getLegalEntity({ id });
  const milestones = await MilestoneService(u).listMilestonesForLegalEntity({ legalEntity });

  const url = new URL(request.url);
  const year = new Date().getUTCFullYear();
  const start = new Date(url.searchParams.get("start") || new Date(year, 0, 1));
  const end = new Date(url.searchParams.get("end") || new Date(year, 11, 31));
  const status = (url.searchParams.get("status") || Status.Approved) as Status;

  const service = ScheduleService(u);
  const schedules = await service.listSchedulesByLegalEntity({ legalEntityId: id, start, end, status });
  const holidays = await service.listHolidaysForSchedules({ legalEntityId: id, start, end, status });

  const countries = await CountryService().getCountries({ isoCodes: holidays.map((h: Holiday) => h.locality) });

  const workbook = await ExcelService().generate({ legalEntity, milestones, schedules, holidays, countries, start, end });
  const buffer = await workbook.xlsx.writeBuffer();
  
  const blob = new Blob([ buffer ], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  return new Response(blob, {
    status: 200,
    headers: {
      'Content-Type': blob.type,
      'Content-Disposition': 'attachment'
    }
  });
};
