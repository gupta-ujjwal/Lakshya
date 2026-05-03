import { NextResponse } from "next/server";
import { getSampleSchedule } from "@/lib/api/schedules/ingest";

export async function GET() {
  const sample = getSampleSchedule();
  return NextResponse.json(sample);
}
