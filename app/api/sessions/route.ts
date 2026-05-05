import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/api/auth";
import { startOfDay } from "@/lib/api/dates";
import {
  StartSessionSchema,
  DEFAULT_FOCUS_MINUTES,
} from "@/lib/api/sessions/schemas";

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

    const schedule = await prisma.schedule.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    if (!schedule) {
      return NextResponse.json({ error: "No schedule found" }, { status: 404 });
    }

    const today = startOfDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let task: { id: string; title: string; subject: string } | null = null;

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
      const candidates = await prisma.task.findMany({
        where: {
          scheduleId: schedule.id,
          targetDate: { gte: today, lt: tomorrow },
        },
        orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
        select: {
          id: true,
          title: true,
          subject: true,
          progress: { where: { date: today }, select: { status: true } },
        },
      });
      const next = candidates.find(
        (t) => !t.progress.some((p) => p.status === "completed")
      );
      if (next) {
        task = { id: next.id, title: next.title, subject: next.subject };
      }
    }

    const session = await prisma.session.create({
      data: {
        userId,
        taskId: task?.id ?? null,
        startedAt: new Date(),
      },
      select: { id: true, startedAt: true, taskId: true },
    });

    return NextResponse.json({
      session: {
        id: session.id,
        startedAt: session.startedAt.toISOString(),
        taskId: session.taskId,
        focusMinutes,
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
