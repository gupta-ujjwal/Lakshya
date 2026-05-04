import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CreateTaskProgressSchema } from "@/lib/api/progress/schemas";
import { startOfDay } from "@/lib/api/utils";

const ProgressBodySchema = CreateTaskProgressSchema.omit({
  taskId: true,
  date: true,
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get("x-user-id") || "anonymous";
    const taskId = params.id;
    const body = await request.json();

    const parsed = ProgressBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const task = await prisma.task.findFirst({
      where: { id: taskId, schedule: { userId } },
      select: { id: true },
    });
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const today = startOfDay(new Date());

    const progress = await prisma.taskProgress.upsert({
      where: { taskId_date: { taskId, date: today } },
      create: {
        taskId,
        status: parsed.data.status,
        notes: parsed.data.notes,
        date: today,
      },
      update: {
        status: parsed.data.status,
        notes: parsed.data.notes,
      },
    });

    return NextResponse.json({ progress });
  } catch (error) {
    console.error("Task progress error:", error);
    return NextResponse.json(
      { error: "Failed to update progress" },
      { status: 500 }
    );
  }
}
