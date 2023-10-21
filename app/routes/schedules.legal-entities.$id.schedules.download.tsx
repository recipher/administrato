import type { LoaderFunction, LoaderArgs } from "@remix-run/node";
import { requireUser } from "~/auth/auth.server";
import { badRequest } from "~/utility/errors";

import ExcelService from '~/services/scheduler/excel.server';

export const loader: LoaderFunction = async ({ request, params }: LoaderArgs) => {
  const u = await requireUser(request);

  const { id } = params;

  if (id === undefined) return badRequest('Invalid request');
  
  const workbook = await ExcelService().generate();
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
