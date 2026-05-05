import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/api/auth";

export async function GET(request: NextRequest) {
  try {
    const userId = getCurrentUserId(request);

    const session = await prisma.session.findFirst({
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

    if (!session) {
      return NextResponse.json({ session: null });
    }

    return NextResponse.json({
      session: {
        id: session.id,
        startedAt: session.startedAt.toISOString(),
        taskId: session.taskId,
        focusMinutes: session.focusMinutes,
      },
      task: session.task,
    });
  } catch (error) {
    console.error("Active session error:", error);
    return NextResponse.json(
      { error: "Failed to fetch active session" },
      { status: 500 }
    );
  }
}
