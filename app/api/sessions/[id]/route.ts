import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/api/auth";
import { startOfDay } from "@/lib/api/dates";
import { EndSessionSchema } from "@/lib/api/sessions/schemas";
import { PROGRESS_COMPLETED } from "@/lib/api/progress/schemas";

const SESSION_SELECT = {
  id: true,
  startedAt: true,
  endedAt: true,
  duration: true,
  focusMinutes: true,
  reflection: true,
  taskId: true,
} as const;

interface SessionRecord {
  id: string;
  startedAt: Date;
  endedAt: Date | null;
  duration: number | null;
  focusMinutes: number;
  reflection: string | null;
  taskId: string | null;
}

function sessionResponse(s: SessionRecord) {
  return {
    session: {
      ...s,
      startedAt: s.startedAt.toISOString(),
      endedAt: s.endedAt?.toISOString() ?? null,
    },
  };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getCurrentUserId(request);
    const body = await request.json().catch(() => ({}));

    const parsed = EndSessionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const session = await prisma.session.findFirst({
      where: { id: params.id, userId },
      select: SESSION_SELECT,
    });
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Idempotent finish: if a prior PATCH already closed this session,
    // return the existing record without re-running the update or the
    // TaskProgress upsert. Prevents double-counting on retry / double-click.
    if (session.endedAt) {
      return NextResponse.json(sessionResponse(session));
    }

    const endedAt = new Date();
    const duration = Math.max(
      0,
      Math.round((endedAt.getTime() - session.startedAt.getTime()) / 1000)
    );

    const sessionUpdate = prisma.session.update({
      where: { id: session.id },
      data: {
        endedAt,
        duration,
        reflection: parsed.data.reflection,
      },
      select: SESSION_SELECT,
    });

    const progressDate = startOfDay(new Date());
    const completion =
      parsed.data.markTaskComplete && session.taskId
        ? prisma.taskProgress.upsert({
            where: {
              taskId_date: { taskId: session.taskId, date: progressDate },
            },
            create: {
              taskId: session.taskId,
              status: PROGRESS_COMPLETED,
              date: progressDate,
            },
            update: { status: PROGRESS_COMPLETED },
          })
        : Promise.resolve(null);

    const [updated] = await Promise.all([sessionUpdate, completion]);

    return NextResponse.json(sessionResponse(updated));
  } catch (error) {
    console.error("End session error:", error);
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    );
  }
}
