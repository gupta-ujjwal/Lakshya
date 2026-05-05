import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/api/auth";
import { startOfDay } from "@/lib/api/dates";
import {
  StartSessionSchema,
  DEFAULT_FOCUS_MINUTES,
} from "@/lib/api/sessions/schemas";
import { pickNextTaskForToday, NextTask } from "@/lib/api/sessions/nextTask";
import {
  SESSION_OPEN_SELECT,
  SESSION_OPEN_WITH_TASK_SELECT,
  formatOpenSession,
} from "@/lib/api/sessions/serialize";

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

    // Open-session check and schedule lookup are independent reads — fan
    // them out so the success path saves a round-trip; rejection paths
    // discard the unused schedule (one cheap select).
    const [open, schedule] = await Promise.all([
      prisma.session.findFirst({
        where: { userId, endedAt: null },
        orderBy: { startedAt: "desc" },
        select: SESSION_OPEN_WITH_TASK_SELECT,
      }),
      prisma.schedule.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      }),
    ]);

    // 409 first: with the existing session embedded so the client can
    // recover without a second round-trip to GET /api/sessions/active.
    if (open) {
      const { task: openTask, ...openSession } = open;
      return NextResponse.json(
        {
          error: "Session already active",
          session: formatOpenSession(openSession),
          task: openTask,
        },
        { status: 409 }
      );
    }
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
      select: SESSION_OPEN_SELECT,
    });

    return NextResponse.json({
      session: formatOpenSession(session),
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
