import { db } from "@/db";
import { PROGRESS_COMPLETED } from "@/domain/progress";
import { addDaysToKey, today } from "@/lib/dates";
import { getLatestSchedule } from "./schedules";

const STREAK_LOOKBACK_DAYS = 30;
const ADHERENCE_WINDOW_DAYS = 7;

export interface DashboardSchedule {
  id: string;
  title: string;
  targetDate: string;
  createdAt: string;
  hoursPerDay: number;
}

export interface DashboardStats {
  streak: number;
  adherence: number;
  overdueCount: number;
  adherenceWindowDays: number;
}

export interface DashboardTask {
  id: string;
  title: string;
  subject: string;
  targetDate: string;
  priority: number;
  completedToday: boolean;
}

export interface Dashboard {
  schedule: DashboardSchedule;
  stats: DashboardStats;
  tasks: DashboardTask[];
}

function computeStreak(completionDates: Set<string>): number {
  let streak = 0;
  let cursor = today();
  if (!completionDates.has(cursor)) cursor = addDaysToKey(cursor, -1);
  while (completionDates.has(cursor) && streak < STREAK_LOOKBACK_DAYS) {
    streak++;
    cursor = addDaysToKey(cursor, -1);
  }
  return streak;
}

export async function getDashboard(): Promise<Dashboard | null> {
  const schedule = await getLatestSchedule();
  if (!schedule) return null;

  const todayKey = today();
  const streakWindowStart = addDaysToKey(todayKey, -STREAK_LOOKBACK_DAYS);
  const adherenceWindowStart = addDaysToKey(
    todayKey,
    -(ADHERENCE_WINDOW_DAYS - 1),
  );

  const [tasks, recentProgress] = await Promise.all([
    db.tasks.where("scheduleId").equals(schedule.id).toArray(),
    db.taskProgress
      .where("date")
      .aboveOrEqual(streakWindowStart)
      .and((p) => p.status === PROGRESS_COMPLETED)
      .toArray(),
  ]);

  // Only progress tied to this schedule's tasks counts; a stale schedule's
  // completions in the date window would otherwise inflate streak/adherence.
  const taskIds = new Set(tasks.map((t) => t.id));
  const scopedProgress = recentProgress.filter((p) => taskIds.has(p.taskId));

  const completedTodayIds = new Set(
    scopedProgress.filter((p) => p.date === todayKey).map((p) => p.taskId),
  );

  // Streak axis: "did I sit down on day D" — keyed by progress.date,
  // ignores which task. A single completion any day flips the day "on."
  const completionDates = new Set(scopedProgress.map((p) => p.date));
  const streak = computeStreak(completionDates);

  // Adherence axis: "did I hit tasks scheduled in the window" — keyed by
  // task.targetDate, joins back via taskId. Intentionally a different
  // axis from streak: "showed up" and "kept the plan" are different
  // signals.
  const windowTasks = tasks.filter(
    (t) =>
      t.targetDate >= adherenceWindowStart && t.targetDate <= todayKey,
  );
  const windowCompletedIds = new Set(
    scopedProgress
      .filter((p) => p.date >= adherenceWindowStart && p.date <= todayKey)
      .map((p) => p.taskId),
  );
  const windowCompletedCount = windowTasks.filter((t) =>
    windowCompletedIds.has(t.id),
  ).length;
  const adherence =
    windowTasks.length > 0
      ? Math.round((windowCompletedCount / windowTasks.length) * 100)
      : 0;

  const everCompletedIds = new Set(scopedProgress.map((p) => p.taskId));
  const overdueCount = tasks.filter(
    (t) => t.targetDate < todayKey && !everCompletedIds.has(t.id),
  ).length;

  tasks.sort((a, b) =>
    a.targetDate === b.targetDate
      ? b.priority - a.priority
      : a.targetDate.localeCompare(b.targetDate),
  );

  return {
    schedule: {
      id: schedule.id,
      title: schedule.title,
      targetDate: schedule.targetDate,
      createdAt: schedule.createdAt,
      hoursPerDay: schedule.hoursPerDay,
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
      targetDate: task.targetDate,
      priority: task.priority,
      completedToday: completedTodayIds.has(task.id),
    })),
  };
}
