import { db } from "@/db";
import { PROGRESS_COMPLETED } from "@/domain/progress";
import { addDaysToKey, today } from "@/lib/dates";
import { getLatestSchedule } from "./schedules";
import { latestProgressPerTask } from "./tasks";

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
  totalStudyMinutes: number;
}

export interface DashboardTask {
  id: string;
  title: string;
  subject: string;
  targetDate: string;
  priority: number;
  // "Were you marked done for today?" — keyed on progress.date===today.
  completedToday: boolean;
  // True iff the task's latest progress row has `status === completed`,
  // across all dates. Used by the focus-pin filter to avoid surfacing
  // tasks the user already finished — even tasks completed months ago
  // (a 30-day window would mis-surface them).
  completedEver: boolean;
  // Today's two render axes, pre-computed so the page doesn't re-derive
  // them: scheduled-for-today (`targetDate === today`) and pinned by
  // the user's "study X today" focus list. Tasks may match both,
  // either, or neither.
  scheduledForToday: boolean;
  pinnedSubject: boolean;
}

export interface Dashboard {
  schedule: DashboardSchedule;
  stats: DashboardStats;
  tasks: DashboardTask[];
}

export interface GetDashboardInput {
  pinnedSubjects?: string[];
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

export async function getDashboard(
  input: GetDashboardInput = {},
): Promise<Dashboard | null> {
  const schedule = await getLatestSchedule();
  if (!schedule) return null;

  const todayKey = today();
  const streakWindowStart = addDaysToKey(todayKey, -STREAK_LOOKBACK_DAYS);
  const adherenceWindowStart = addDaysToKey(
    todayKey,
    -(ADHERENCE_WINDOW_DAYS - 1),
  );
  const pinnedSubjects = new Set(input.pinnedSubjects ?? []);

  const [tasks, closedSessions] = await Promise.all([
    db.tasks.where("scheduleId").equals(schedule.id).toArray(),
    db.sessions.where("state").equals("closed").toArray(),
  ]);

  // One scoped progress fetch backs every axis below: streak,
  // adherence, today, and "ever completed."
  const taskIds = tasks.map((t) => t.id);
  const allProgress = await db.taskProgress
    .where("taskId")
    .anyOf(taskIds)
    .toArray();

  const completedProgress = allProgress.filter(
    (p) => p.status === PROGRESS_COMPLETED,
  );

  const completedTodayIds = new Set(
    completedProgress
      .filter((p) => p.date === todayKey)
      .map((p) => p.taskId),
  );

  // Streak axis: "did I sit down on day D" — keyed by progress.date,
  // ignores which task. A single completion any day flips the day "on."
  const completionDates = new Set(
    completedProgress
      .filter((p) => p.date >= streakWindowStart)
      .map((p) => p.date),
  );
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
    completedProgress
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

  // Latest-progress-wins for "is this task currently done", regardless
  // of when. Used for both the overdue count and the focus-pin filter
  // — both want to ignore tasks the user has already finished, even
  // ones from months ago.
  const latestByTask = latestProgressPerTask(allProgress);
  const completedEverIds = new Set<string>();
  for (const [id, p] of latestByTask) {
    if (p.status === PROGRESS_COMPLETED) completedEverIds.add(id);
  }
  const overdueCount = tasks.filter(
    (t) => t.targetDate < todayKey && !completedEverIds.has(t.id),
  ).length;

  // closedSessions came from `.where("state").equals("closed")`, so
  // every row's `state` is "closed" by construction.
  const totalStudySeconds = closedSessions.reduce(
    (sum, s) => sum + (s.state === "closed" ? s.duration : 0),
    0,
  );
  const totalStudyMinutes = Math.round(totalStudySeconds / 60);

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
      totalStudyMinutes,
    },
    tasks: tasks.map((task) => ({
      id: task.id,
      title: task.title,
      subject: task.subject,
      targetDate: task.targetDate,
      priority: task.priority,
      completedToday: completedTodayIds.has(task.id),
      completedEver: completedEverIds.has(task.id),
      scheduledForToday: task.targetDate === todayKey,
      pinnedSubject: pinnedSubjects.has(task.subject),
    })),
  };
}

export interface OverallProgress {
  total: number;
  completed: number;
}

export async function getOverallProgress(): Promise<OverallProgress | null> {
  const schedule = await getLatestSchedule();
  if (!schedule) return null;
  const tasks = await db.tasks
    .where("scheduleId")
    .equals(schedule.id)
    .toArray();
  const taskIds = tasks.map((t) => t.id);
  const allProgress = await db.taskProgress
    .where("taskId")
    .anyOf(taskIds)
    .toArray();
  const latestByTask = latestProgressPerTask(allProgress);
  let completed = 0;
  for (const p of latestByTask.values()) {
    if (p.status === PROGRESS_COMPLETED) completed++;
  }
  return { total: tasks.length, completed };
}
