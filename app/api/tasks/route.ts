import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    const userId = request.headers.get("x-user-id") || "anonymous";

    const schedule = await prisma.schedule.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    if (!schedule) {
      return NextResponse.json({ error: "No schedule found" }, { status: 404 });
    }

    const tasks = await prisma.task.findMany({
      where: { scheduleId: schedule.id },
      orderBy: [{ targetDate: "asc" }, { priority: "asc" }],
    });

    const completedProgress = await prisma.taskProgress.findMany({
      where: { task: { scheduleId: schedule.id }, status: "completed" },
      select: { taskId: true },
    });
    const completedTaskIds = new Set(completedProgress.map((p) => p.taskId));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

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
