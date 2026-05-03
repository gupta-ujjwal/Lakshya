import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id") || "anonymous";

    // Get the user's most recent schedule
    const schedule = await prisma.schedule.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    // If no schedule exists, return 404 to trigger redirect to import
    if (!schedule) {
      return NextResponse.json(
        { error: "No schedule found" },
        { status: 404 }
      );
    }

    // Get tasks for this schedule
    const tasks = await prisma.task.findMany({
      where: { scheduleId: schedule.id },
      orderBy: { targetDate: "asc" },
    });

    return NextResponse.json({
      schedule: {
        id: schedule.id,
        title: schedule.title,
        targetDate: schedule.targetDate.toISOString().split("T")[0],
      },
      tasks: tasks.map((task) => ({
        id: task.id,
        title: task.title,
        subject: task.subject,
        targetDate: task.targetDate.toISOString().split("T")[0],
        priority: task.priority,
        completed: false, // TODO: Implement task completion tracking
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
