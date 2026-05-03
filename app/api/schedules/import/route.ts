import { NextRequest, NextResponse } from "next/server";
import { ImportScheduleSchema } from "@/lib/api/schedules/schemas";
import { importSchedule } from "@/lib/api/schedules/ingest";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validation = ImportScheduleSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      );
    }

    const userId = request.headers.get("x-user-id") || "anonymous";
    const result = await importSchedule(userId, validation.data);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      scheduleId: result.scheduleId,
      taskCount: result.taskCount,
    }, { status: 201 });
  } catch (error) {
    console.error("Import schedule API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}