import {
  db,
  newId,
  nowIso,
  type TaskProgressRecord,
  type TaskRecord,
} from "@/db";
import { today } from "@/lib/dates";
import {
  PROGRESS_COMPLETED,
  type TaskProgressStatus,
} from "@/domain/progress";
import { getLatestSchedule } from "./schedules";

export type DerivedTaskStatus = "todo" | "completed" | "overdue";

export interface TaskWithProgress {
  id: string;
  title: string;
  subject: string;
  targetDate: string;
  priority: number;
  status: DerivedTaskStatus;
  // The raw progress row, when present — gives the page access to the
  // updatedAt timestamp without a second lookup.
  progress: TaskProgressRecord | null;
}

export interface ListTasksFilters {
  scheduleId?: string;
  status?: DerivedTaskStatus | "all";
  // empty array = unrestricted (matches Dexie .anyOf semantics).
  subjects?: string[];
  fromDate?: string;
  toDate?: string;
  minPriority?: number;
}

export async function recordTaskProgress(
  taskId: string,
  status: TaskProgressStatus,
  notes?: string,
): Promise<TaskProgressRecord> {
  // The find-then-add path races against a concurrent tab: both reads
  // miss, both adds attempt, and the &[taskId+date] unique index throws
  // ConstraintError on the loser. Wrapping in a Dexie rw transaction
  // serializes the read-modify-write — IndexedDB is single-threaded
  // within a transaction.
  return db.transaction("rw", db.tasks, db.taskProgress, async () => {
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
  });
}

export async function pickNextTaskForToday(scheduleId: string): Promise<{
  id: string;
  title: string;
  subject: string;
} | null> {
  const todayKey = today();
  const [candidates, completed] = await Promise.all([
    db.tasks
      .where("[scheduleId+targetDate]")
      .equals([scheduleId, todayKey])
      .toArray(),
    db.taskProgress
      .where("date")
      .equals(todayKey)
      .and((p) => p.status === PROGRESS_COMPLETED)
      .toArray(),
  ]);
  if (candidates.length === 0) return null;

  // Highest priority first; ties broken by createdAt asc for stability.
  candidates.sort((a, b) =>
    a.priority === b.priority
      ? a.createdAt.localeCompare(b.createdAt)
      : b.priority - a.priority,
  );

  const completedIds = new Set(completed.map((p) => p.taskId));
  const next = candidates.find((t) => !completedIds.has(t.id));
  return next
    ? { id: next.id, title: next.title, subject: next.subject }
    : null;
}

export async function listTasks(
  filters: ListTasksFilters = {},
): Promise<TaskWithProgress[]> {
  const scheduleId = filters.scheduleId ?? (await getLatestSchedule())?.id;
  if (!scheduleId) return [];

  const todayKey = today();
  const [tasks, progress] = await Promise.all([
    db.tasks.where("scheduleId").equals(scheduleId).toArray(),
    fetchProgressForTasks(scheduleId),
  ]);

  // Latest-progress-per-task wins. The taskProgress table is keyed
  // `&[taskId+date]`, so multiple rows per task are possible across
  // days. We surface the row whose updatedAt is newest as the task's
  // current status.
  const progressByTask = new Map<string, TaskProgressRecord>();
  for (const p of progress) {
    const prev = progressByTask.get(p.taskId);
    if (!prev || p.updatedAt > prev.updatedAt) progressByTask.set(p.taskId, p);
  }

  const subjectAllowed = filters.subjects?.length
    ? new Set(filters.subjects)
    : null;

  const enriched: TaskWithProgress[] = tasks
    .filter((t) => {
      if (subjectAllowed && !subjectAllowed.has(t.subject)) return false;
      if (filters.fromDate && t.targetDate < filters.fromDate) return false;
      if (filters.toDate && t.targetDate > filters.toDate) return false;
      if (filters.minPriority !== undefined && t.priority < filters.minPriority)
        return false;
      return true;
    })
    .map((t) => {
      const p = progressByTask.get(t.id) ?? null;
      const status = deriveStatus(t, p, todayKey);
      return {
        id: t.id,
        title: t.title,
        subject: t.subject,
        targetDate: t.targetDate,
        priority: t.priority,
        status,
        progress: p,
      };
    });

  const filtered =
    !filters.status || filters.status === "all"
      ? enriched
      : enriched.filter((t) => t.status === filters.status);

  // Sort: priority desc, targetDate asc, title asc — stable tie-break.
  filtered.sort((a, b) => {
    if (a.priority !== b.priority) return b.priority - a.priority;
    if (a.targetDate !== b.targetDate)
      return a.targetDate.localeCompare(b.targetDate);
    return a.title.localeCompare(b.title);
  });

  return filtered;
}

export async function listSubjects(scheduleId?: string): Promise<string[]> {
  const id = scheduleId ?? (await getLatestSchedule())?.id;
  if (!id) return [];
  const tasks = await db.tasks.where("scheduleId").equals(id).toArray();
  return Array.from(new Set(tasks.map((t) => t.subject))).sort();
}

async function fetchProgressForTasks(
  scheduleId: string,
): Promise<TaskProgressRecord[]> {
  // Two-step rather than a join: Dexie can't index across tables. The
  // taskProgress table doesn't carry scheduleId, so we collect taskIds
  // from the schedule first, then ask taskProgress for matches.
  const tasks = await db.tasks.where("scheduleId").equals(scheduleId).toArray();
  const ids = tasks.map((t) => t.id);
  if (ids.length === 0) return [];
  return db.taskProgress.where("taskId").anyOf(ids).toArray();
}

function deriveStatus(
  task: TaskRecord,
  progress: TaskProgressRecord | null,
  todayKey: string,
): DerivedTaskStatus {
  if (progress?.status === PROGRESS_COMPLETED) return "completed";
  if (task.targetDate < todayKey) return "overdue";
  return "todo";
}
