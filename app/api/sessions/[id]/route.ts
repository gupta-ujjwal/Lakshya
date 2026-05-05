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
      select: { id: true, startedAt: true, endedAt: true, taskId: true },
    });
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const endedAt = session.endedAt ?? new Date();
    const duration = Math.max(
      0,
      Math.round((endedAt.getTime() - session.startedAt.getTime()) / 1000)
    );

    const updated = await prisma.session.update({
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

    if (parsed.data.markTaskComplete && session.taskId) {
      const today = startOfDay(new Date());
      await prisma.taskProgress.upsert({
        where: { taskId_date: { taskId: session.taskId, date: today } },
        create: { taskId: session.taskId, status: PROGRESS_COMPLETED, date: today },
        update: { status: PROGRESS_COMPLETED },
      });
    }

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
