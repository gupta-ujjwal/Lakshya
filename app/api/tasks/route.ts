import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PROGRESS_COMPLETED } from "@/lib/api/progress/schemas";
import { startOfDay } from "@/lib/api/dates";
import { getCurrentUserId } from "@/lib/api/auth";

export type TaskStatus = "pending" | "completed" | "overdue";

export interface TaskListItem {
  id: string;
  title: string;
  subject: string;
  targetDate: string;
  priority: number;
  status: TaskStatus;
}

export async function GET(request: NextRequest) {
  try {
    const userId = getCurrentUserId(request);

    const schedule = await prisma.schedule.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    if (!schedule) {
      return NextResponse.json({ error: "No schedule found" }, { status: 404 });
    }

    // All-time completion: a task is "completed" if it has any progress
    // record with status="completed", regardless of when. The dashboard
    // route uses a today-only window for its adherence/streak math — the
    // two semantics are intentionally different views of the same source.
    // See app/api/dashboard/route.ts for the day-windowed equivalent.
    const [tasks, completedProgress] = await Promise.all([
      prisma.task.findMany({
        where: { scheduleId: schedule.id },
        orderBy: [{ targetDate: "asc" }, { priority: "asc" }],
      }),
      prisma.taskProgress.findMany({
        where: { task: { scheduleId: schedule.id }, status: PROGRESS_COMPLETED },
        select: { taskId: true },
      }),
    ]);
    const completedTaskIds = new Set(completedProgress.map((p) => p.taskId));

    const today = startOfDay(new Date());

    const items: TaskListItem[] = tasks.map((task) => {
      const completed = completedTaskIds.has(task.id);
      const status: TaskStatus = completed
        ? "completed"
        : task.targetDate < today
          ? "overdue"
          : "pending";
      return {
        id: task.id,
        title: task.title,
        subject: task.subject,
        targetDate: task.targetDate.toISOString().split("T")[0],
        priority: task.priority,
        status,
      };
    });

    return NextResponse.json({ tasks: items });
  } catch (error) {
    console.error("Tasks list API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}
