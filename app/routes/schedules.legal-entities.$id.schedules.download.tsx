import type { LoaderFunction, LoaderArgs } from "@remix-run/node";
import { requireUser } from "~/auth/auth.server";
import { badRequest } from "~/utility/errors";

import LegalEntityService from '~/services/manage/legal-entities.server';
import MilestoneService from '~/services/scheduler/milestones.server';
import ScheduleService from '~/services/scheduler/schedules.server';
import HolidayService from '~/services/scheduler/holidays.server';
import ExcelService from '~/services/scheduler/excel.server';

export const loader: LoaderFunction = async ({ request, params }: LoaderArgs) => {
  const u = await requireUser(request);

  const { id } = params;

  if (id === undefined) return badRequest('Invalid request');
  
  const legalEntity = await LegalEntityService(u).getLegalEntity({ id });
  const milestones = await MilestoneService(u).listMilestonesForLegalEntity({ legalEntity });

  const url = new URL(request.url);
  const start = url.searchParams.get("start")
  const end = url.searchParams.get("end")
  const status = url.searchParams.get("status");

  const workbook = await ExcelService().generate({ legalEntity, milestones });
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
