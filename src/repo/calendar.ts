import { db } from "@/db";
import { PROGRESS_COMPLETED } from "@/domain/progress";
import { addDaysToKey, today } from "@/lib/dates";
import { getLatestSchedule } from "./schedules";

export type CalendarHeat = "empty" | "future" | "todo" | "partial" | "done" | "overdue";

export interface CalendarDay {
  date: string;       // YYYY-MM-DD
  total: number;      // tasks targeted at this date
  completed: number;  // taskProgress rows with status=completed for this date
  heat: CalendarHeat;
}

/** monthKey is "YYYY-MM"; returns one CalendarDay per calendar day in that month. */
export async function getCalendarSummary(monthKey: string): Promise<CalendarDay[]> {
  const schedule = await getLatestSchedule();
  if (!schedule) return [];

  const [firstDay, lastDay] = monthBounds(monthKey);
  const dateKeys = enumerateDays(firstDay, lastDay);
  const todayKey = today();

  const [tasks, progress] = await Promise.all([
    db.tasks
      .where("[scheduleId+targetDate]")
      .between([schedule.id, firstDay], [schedule.id, lastDay], true, true)
      .toArray(),
    db.taskProgress
      .where("date")
      .between(firstDay, lastDay, true, true)
      .and((p) => p.status === PROGRESS_COMPLETED)
      .toArray(),
  ]);

  // Restrict completion counts to tasks belonging to *this* schedule —
  // a stale schedule's progress in the same date window would otherwise
  // inflate the calendar's "done" count, mirroring getDashboard()'s
  // scoping rule.
  const taskIdsInSchedule = new Set(tasks.map((t) => t.id));
  const scopedProgress = progress.filter((p) => taskIdsInSchedule.has(p.taskId));

  const totalsByDate = bucketByDate(tasks, (t) => t.targetDate);
  const completedByDate = bucketByDate(scopedProgress, (p) => p.date);

  return dateKeys.map((date) => {
    const total = totalsByDate.get(date) ?? 0;
    const completed = completedByDate.get(date) ?? 0;
    return {
      date,
      total,
      completed,
      heat: deriveHeat(date, todayKey, total, completed),
    };
  });
}

function deriveHeat(
  date: string,
  todayKey: string,
  total: number,
  completed: number,
): CalendarHeat {
  if (total === 0) return "empty";
  if (completed >= total) return "done";
  if (date > todayKey) return "future";
  // Today's cell intentionally renders "todo" regardless of partial
  // completion — the day isn't over, so 1/2 done is still in-progress
  // rather than a missed opportunity. "partial" is reserved for past
  // days where the user started but didn't finish; "overdue" for past
  // days with zero completions.
  if (date === todayKey) return "todo";
  if (completed > 0) return "partial";
  return "overdue";
}

function monthBounds(monthKey: string): [string, string] {
  const first = `${monthKey}-01`;
  // The next-month-first-day minus one day works for every month length
  // including February + leap years, since fromDateKey/addDaysToKey are
  // calendar-day arithmetic.
  const [yearStr, monthStr] = monthKey.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const nextMonth = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const last = addDaysToKey(nextMonth, -1);
  return [first, last];
}

function enumerateDays(fromKey: string, toKey: string): string[] {
  const out: string[] = [];
  let cursor = fromKey;
  while (cursor <= toKey) {
    out.push(cursor);
    cursor = addDaysToKey(cursor, 1);
  }
  return out;
}

function bucketByDate<T>(items: T[], dateOf: (t: T) => string): Map<string, number> {
  const m = new Map<string, number>();
  for (const item of items) {
    const k = dateOf(item);
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}
