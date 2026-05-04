import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PROGRESS_COMPLETED } from "@/lib/api/progress/schemas";
import { startOfDay } from "@/lib/api/utils";

const STREAK_LOOKBACK_DAYS = 30;
const ADHERENCE_WINDOW_DAYS = 7;

function dateKey(date: Date): string {
  return startOfDay(date).toISOString().split("T")[0];
}

function computeStreak(completionDates: Set<string>): number {
  let streak = 0;
  const cursor = startOfDay(new Date());
  const todayKey = dateKey(cursor);
  if (!completionDates.has(todayKey)) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (completionDates.has(dateKey(cursor)) && streak < STREAK_LOOKBACK_DAYS) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id") || "anonymous";

    const schedule = await prisma.schedule.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    if (!schedule) {
      return NextResponse.json(
        { error: "No schedule found" },
        { status: 404 }
      );
    }

    const tasks = await prisma.task.findMany({
      where: { scheduleId: schedule.id },
      orderBy: [{ targetDate: "asc" }, { priority: "desc" }],
    });

    const today = startOfDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const adherenceWindowStart = new Date(today);
    adherenceWindowStart.setDate(
      adherenceWindowStart.getDate() - (ADHERENCE_WINDOW_DAYS - 1)
    );

    const streakWindowStart = new Date(today);
    streakWindowStart.setDate(
      streakWindowStart.getDate() - STREAK_LOOKBACK_DAYS
    );

    const recentProgress = await prisma.taskProgress.findMany({
      where: {
        task: { scheduleId: schedule.id },
        status: PROGRESS_COMPLETED,
        date: { gte: streakWindowStart },
      },
      select: { taskId: true, date: true },
    });

    const completedTodayIds = new Set(
      recentProgress
        .filter((p) => p.date >= today && p.date < tomorrow)
        .map((p) => p.taskId)
    );

    const completionDates = new Set(recentProgress.map((p) => dateKey(p.date)));
    const streak = computeStreak(completionDates);

    const windowTasks = tasks.filter(
      (t) => t.targetDate >= adherenceWindowStart && t.targetDate < tomorrow
    );
    const windowCompletedIds = new Set(
      recentProgress
        .filter((p) => p.date >= adherenceWindowStart && p.date < tomorrow)
        .map((p) => p.taskId)
    );
    const windowCompletedCount = windowTasks.filter((t) =>
      windowCompletedIds.has(t.id)
    ).length;
    const adherence =
      windowTasks.length > 0
        ? Math.round((windowCompletedCount / windowTasks.length) * 100)
        : 0;

    const everCompletedIds = new Set(recentProgress.map((p) => p.taskId));
    const overdueCount = tasks.filter(
      (t) => t.targetDate < today && !everCompletedIds.has(t.id)
    ).length;

    return NextResponse.json({
      schedule: {
        id: schedule.id,
        title: schedule.title,
        targetDate: schedule.targetDate.toISOString().split("T")[0],
        createdAt: schedule.createdAt.toISOString(),
      },
      stats: {
        streak,
        adherence,
        overdueCount,
        adherenceWindowDays: ADHERENCE_WINDOW_DAYS,
      },
      tasks: tasks.map((task) => ({
        id: task.id,
        title: task.title,
        subject: task.subject,
        targetDate: task.targetDate.toISOString().split("T")[0],
        priority: task.priority,
        completed: completedTodayIds.has(task.id),
      })),
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
