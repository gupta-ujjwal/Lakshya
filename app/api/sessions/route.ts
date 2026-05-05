import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/api/auth";
import { startOfDay } from "@/lib/api/dates";
import {
  StartSessionSchema,
  DEFAULT_FOCUS_MINUTES,
} from "@/lib/api/sessions/schemas";
import { pickNextTaskForToday, NextTask } from "@/lib/api/sessions/nextTask";

export async function POST(request: NextRequest) {
  try {
    const userId = getCurrentUserId(request);
    const body = await request.json().catch(() => ({}));

    const parsed = StartSessionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const focusMinutes = parsed.data.focusMinutes ?? DEFAULT_FOCUS_MINUTES;

    // Reject concurrent starts: a double-click or a second tab must not
    // create a parallel Session row. The client can call GET /api/sessions/active
    // to recover the existing one.
    const open = await prisma.session.findFirst({
      where: { userId, endedAt: null },
      orderBy: { startedAt: "desc" },
      select: {
        id: true,
        startedAt: true,
        taskId: true,
        focusMinutes: true,
        task: { select: { id: true, title: true, subject: true } },
      },
    });
    if (open) {
      return NextResponse.json(
        {
          error: "Session already active",
          session: {
            id: open.id,
            startedAt: open.startedAt.toISOString(),
            taskId: open.taskId,
            focusMinutes: open.focusMinutes,
          },
          task: open.task,
        },
        { status: 409 }
      );
    }

    const schedule = await prisma.schedule.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    if (!schedule) {
      return NextResponse.json({ error: "No schedule found" }, { status: 404 });
    }

    const today = startOfDay(new Date());

    let task: NextTask | null = null;

    if (parsed.data.taskId) {
      const found = await prisma.task.findFirst({
        where: { id: parsed.data.taskId, scheduleId: schedule.id },
        select: { id: true, title: true, subject: true },
      });
      if (!found) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }
      task = found;
    } else {
      task = await pickNextTaskForToday(schedule.id, today);
    }

    const session = await prisma.session.create({
      data: {
        userId,
        taskId: task?.id ?? null,
        startedAt: new Date(),
        focusMinutes,
      },
      select: { id: true, startedAt: true, taskId: true, focusMinutes: true },
    });

    return NextResponse.json({
      session: {
        id: session.id,
        startedAt: session.startedAt.toISOString(),
        taskId: session.taskId,
        focusMinutes: session.focusMinutes,
      },
      task,
    });
  } catch (error) {
    console.error("Start session error:", error);
    return NextResponse.json(
      { error: "Failed to start session" },
      { status: 500 }
    );
  }
}
