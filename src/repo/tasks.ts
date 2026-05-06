import { db, newId, nowIso, type TaskProgressRecord } from "@/db";
import { today } from "@/lib/dates";
import {
  PROGRESS_COMPLETED,
  type TaskProgressStatus,
} from "@/domain/progress";
import { getLatestSchedule } from "./schedules";

export type TaskStatus = "pending" | "completed" | "overdue";

export interface TaskListItem {
  id: string;
  title: string;
  subject: string;
  targetDate: string;
  priority: number;
  status: TaskStatus;
}

export async function listTasks(): Promise<TaskListItem[] | null> {
  const schedule = await getLatestSchedule();
  if (!schedule) return null;

  const [tasks, completed] = await Promise.all([
    db.tasks
      .where("scheduleId")
      .equals(schedule.id)
      .sortBy("targetDate")
      .then((rows) =>
        rows.sort((a, b) =>
          a.targetDate === b.targetDate
            ? a.priority - b.priority
            : a.targetDate.localeCompare(b.targetDate),
        ),
      ),
    db.taskProgress.where("status").equals(PROGRESS_COMPLETED).toArray(),
  ]);

  const completedIds = new Set(completed.map((p) => p.taskId));
  const todayKey = today();

  return tasks.map((task) => ({
    id: task.id,
    title: task.title,
    subject: task.subject,
    targetDate: task.targetDate,
    priority: task.priority,
    status: completedIds.has(task.id)
      ? "completed"
      : task.targetDate < todayKey
        ? "overdue"
        : "pending",
  }));
}

export async function recordTaskProgress(
  taskId: string,
  status: TaskProgressStatus,
  notes?: string,
): Promise<TaskProgressRecord> {
  const task = await db.tasks.get(taskId);
  if (!task) throw new Error("Task not found");

  const dateKey = today();
  const existing = await db.taskProgress
    .where("[taskId+date]")
    .equals([taskId, dateKey])
    .first();

  const now = nowIso();
  if (existing) {
    const updated: TaskProgressRecord = {
      ...existing,
      status,
      notes: notes ?? existing.notes,
      updatedAt: now,
    };
    await db.taskProgress.put(updated);
    return updated;
  }

  const record: TaskProgressRecord = {
    id: newId(),
    taskId,
    date: dateKey,
    status,
    notes: notes ?? null,
    createdAt: now,
    updatedAt: now,
  };
  await db.taskProgress.add(record);
  return record;
}

export async function pickNextTaskForToday(scheduleId: string): Promise<{
  id: string;
  title: string;
  subject: string;
} | null> {
  const todayKey = today();
  const candidates = await db.tasks
    .where("[scheduleId+targetDate]")
    .equals([scheduleId, todayKey])
    .toArray();
  if (candidates.length === 0) return null;

  // Highest priority first; ties broken by createdAt asc for stability.
  candidates.sort((a, b) =>
    a.priority === b.priority
      ? a.createdAt.localeCompare(b.createdAt)
      : b.priority - a.priority,
  );

  const completed = await db.taskProgress
    .where("date")
    .equals(todayKey)
    .and((p) => p.status === PROGRESS_COMPLETED)
    .toArray();
  const completedIds = new Set(completed.map((p) => p.taskId));

  const next = candidates.find((t) => !completedIds.has(t.id));
  return next
    ? { id: next.id, title: next.title, subject: next.subject }
    : null;
}
