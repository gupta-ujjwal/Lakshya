import { prisma } from "@/lib/prisma";
import { nextDay } from "@/lib/api/dates";

export interface NextTask {
  id: string;
  title: string;
  subject: string;
}

// Picks the highest-priority incomplete task scheduled for `today`, in the
// user's most recent schedule. Ties broken by createdAt ascending so the
// pick is stable across requests within a tick.
export async function pickNextTaskForToday(
  scheduleId: string,
  today: Date
): Promise<NextTask | null> {
  const tomorrow = nextDay(today);

  const candidates = await prisma.task.findMany({
    where: {
      scheduleId,
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
  return next ? { id: next.id, title: next.title, subject: next.subject } : null;
}
