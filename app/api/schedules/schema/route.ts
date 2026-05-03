import { NextResponse } from "next/server";
import { ImportScheduleSchema } from "@/lib/api/schedules/schemas";

export async function GET() {
  return NextResponse.json(ImportScheduleSchema, {
    headers: {
      "Content-Disposition": 'attachment; filename="schedule-schema.json"',
    },
  });
}
