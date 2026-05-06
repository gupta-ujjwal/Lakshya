import { db, newId, nowIso } from "@/db";
import {
  DEFAULT_FOCUS_MINUTES,
  type ClosedSession,
  type EndSessionInput,
  type OpenSession,
  type StartSessionInput,
  type TaskPreview,
} from "@/domain/session";
import { PROGRESS_COMPLETED } from "@/domain/progress";
import { getLatestSchedule } from "./schedules";
import { pickNextTaskForToday, recordTaskProgress } from "./tasks";

export interface ActiveSession {
  session: OpenSession;
  task: TaskPreview | null;
}

export async function getActiveSession(): Promise<ActiveSession | null> {
  const open = await db.sessions
    .where("state")
    .equals("open")
    .reverse()
    .sortBy("startedAt");
  const session = open[0];
  if (!session || session.state !== "open") return null;
  const task = await loadTaskPreview(session.taskId);
  return { session, task };
}

export class SessionAlreadyActiveError extends Error {
  constructor(
    public active: ActiveSession,
  ) {
    super("Session already active");
  }
}

export async function startSession(
  input: StartSessionInput = {},
): Promise<{ session: OpenSession; task: TaskPreview | null }> {
  const existing = await getActiveSession();
  if (existing) throw new SessionAlreadyActiveError(existing);

  const schedule = await getLatestSchedule();
  if (!schedule) throw new Error("No schedule found");

  let task: TaskPreview | null = null;
  if (input.taskId) {
    const found = await db.tasks.get(input.taskId);
    if (!found || found.scheduleId !== schedule.id) {
      throw new Error("Task not found");
    }
    task = { id: found.id, title: found.title, subject: found.subject };
  } else {
    task = await pickNextTaskForToday(schedule.id);
  }

  const session: OpenSession = {
    id: newId(),
    state: "open",
    startedAt: nowIso(),
    taskId: task?.id ?? null,
    focusMinutes: input.focusMinutes ?? DEFAULT_FOCUS_MINUTES,
    createdAt: nowIso(),
  };
  await db.sessions.add(session);
  return { session, task };
}

export async function endSession(
  id: string,
  input: EndSessionInput = {},
): Promise<ClosedSession> {
  const existing = await db.sessions.get(id);
  if (!existing) throw new Error("Session not found");

  // Idempotent on retry / double-tap — re-applying would clobber duration
  // with a later snapshot and double-write task progress.
  if (existing.state === "closed") return existing;

  const endedAt = nowIso();
  const startedMs = new Date(existing.startedAt).getTime();
  const duration = Math.max(
    0,
    Math.round((Date.parse(endedAt) - startedMs) / 1000),
  );

  const closed: ClosedSession = {
    id: existing.id,
    state: "closed",
    startedAt: existing.startedAt,
    endedAt,
    duration,
    taskId: existing.taskId,
    focusMinutes: existing.focusMinutes,
    reflection: input.reflection ?? null,
    createdAt: existing.createdAt,
  };

  await db.sessions.put(closed);

  if (input.markTaskComplete && existing.taskId) {
    await recordTaskProgress(existing.taskId, PROGRESS_COMPLETED);
  }

  return closed;
}

async function loadTaskPreview(
  taskId: string | null,
): Promise<TaskPreview | null> {
  if (!taskId) return null;
  const task = await db.tasks.get(taskId);
  return task
    ? { id: task.id, title: task.title, subject: task.subject }
    : null;
}
