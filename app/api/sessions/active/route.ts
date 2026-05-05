import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/api/auth";
import {
  SESSION_OPEN_WITH_TASK_SELECT,
  formatOpenSession,
} from "@/lib/api/sessions/serialize";

export async function GET(request: NextRequest) {
  try {
    const userId = getCurrentUserId(request);

    const session = await prisma.session.findFirst({
      where: { userId, endedAt: null },
      orderBy: { startedAt: "desc" },
      select: SESSION_OPEN_WITH_TASK_SELECT,
    });

    if (!session) {
      return NextResponse.json({ session: null });
    }

    const { task, ...open } = session;
    return NextResponse.json({
      session: formatOpenSession(open),
      task,
    });
  } catch (error) {
    console.error("Active session error:", error);
    return NextResponse.json(
      { error: "Failed to fetch active session" },
      { status: 500 }
    );
  }
}
