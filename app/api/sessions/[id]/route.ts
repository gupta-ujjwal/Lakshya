import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/api/auth";
import { startOfDay } from "@/lib/api/dates";
import { EndSessionSchema } from "@/lib/api/sessions/schemas";
import { PROGRESS_COMPLETED } from "@/lib/api/progress/schemas";

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
      select: {
        id: true,
        startedAt: true,
        endedAt: true,
        duration: true,
        reflection: true,
        taskId: true,
      },
    });
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Idempotent finish: if a prior PATCH already closed this session,
    // return the existing record without re-running the update or the
    // TaskProgress upsert. Prevents double-counting on retry / double-click.
    if (session.endedAt) {
      return NextResponse.json({
        session: {
          ...session,
          startedAt: session.startedAt.toISOString(),
          endedAt: session.endedAt.toISOString(),
        },
      });
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
      select: {
        id: true,
        startedAt: true,
        endedAt: true,
        duration: true,
        reflection: true,
        taskId: true,
      },
    });

    const completion =
      parsed.data.markTaskComplete && session.taskId
        ? prisma.taskProgress.upsert({
            where: {
              taskId_date: {
                taskId: session.taskId,
                date: startOfDay(new Date()),
              },
            },
            create: {
              taskId: session.taskId,
              status: PROGRESS_COMPLETED,
              date: startOfDay(new Date()),
            },
            update: { status: PROGRESS_COMPLETED },
          })
        : Promise.resolve(null);

    const [updated] = await Promise.all([sessionUpdate, completion]);

    return NextResponse.json({
      session: {
        ...updated,
        startedAt: updated.startedAt.toISOString(),
        endedAt: updated.endedAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    console.error("End session error:", error);
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    );
  }
}
