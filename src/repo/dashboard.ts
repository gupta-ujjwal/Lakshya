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
  // "Has this task ever been marked done in the recent window?" —
  // approximation used by the focus-pin filter to avoid surfacing
  // already-finished tasks. Window is `STREAK_LOOKBACK_DAYS` days,
  // matching the streak/overdue queries below.
  completedRecently: boolean;
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

  const [tasks, recentProgress, closedSessions] = await Promise.all([
    db.tasks.where("scheduleId").equals(schedule.id).toArray(),
    db.taskProgress
      .where("date")
      .aboveOrEqual(streakWindowStart)
      .and((p) => p.status === PROGRESS_COMPLETED)
      .toArray(),
    db.sessions.where("state").equals("closed").toArray(),
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

  const recentlyCompletedIds = new Set(scopedProgress.map((p) => p.taskId));
  const overdueCount = tasks.filter(
    (t) => t.targetDate < todayKey && !recentlyCompletedIds.has(t.id),
  ).length;

  const totalStudySeconds = closedSessions.reduce(
    (sum, s) => (s.state === "closed" ? sum + s.duration : sum),
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
      completedRecently: recentlyCompletedIds.has(task.id),
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
  // Pulling all progress for the schedule's tasks is bounded by the
  // schedule's task count; the table is keyed `&[taskId+date]` so
  // per-task rows accumulate at one per day at most.
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
