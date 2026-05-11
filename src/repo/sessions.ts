import { db, nowIso, newId } from "@/db";
import {
  type ClosedSession,
  type OpenSession,
  type SessionReflection,
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

// Any open session older than this is treated as abandoned and auto-closed
// on the next `getActiveSession` call, with `endedAt` clipped to
// `startedAt + RECOVERY_CAP_HOURS` so the recorded `duration` can't bleed
// past the cap. Covers two failure modes sharing the same root: (1) tab
// closed mid-active, never stopped; (2) tab closed in the reflect-phase
// gap that existed before #38's split. For NEET-PG, no honest focus block
// runs this long — 12 hours is a safe floor.
export const RECOVERY_CAP_HOURS = 12;

export async function getActiveSession(): Promise<ActiveSession | null> {
  const open = await db.sessions
    .where("state")
    .equals("open")
    .reverse()
    .sortBy("startedAt");
  const session = open[0];
  if (!session || session.state !== "open") return null;

  const startedMs = new Date(session.startedAt).getTime();
  const ageMs = Date.now() - startedMs;
  if (ageMs > RECOVERY_CAP_HOURS * 3600 * 1000) {
    const cappedEndedAt = new Date(
      startedMs + RECOVERY_CAP_HOURS * 3600 * 1000,
    ).toISOString();
    await closeSession(session.id, cappedEndedAt);
    return null;
  }

  const task = session.taskId ? await db.tasks.get(session.taskId) : null;
  return {
    session,
    task: task
      ? { id: task.id, title: task.title, subject: task.subject }
      : null,
  };
}

export type StartSessionResult =
  | { ok: true; session: OpenSession; task: TaskPreview | null }
  | { ok: false; reason: "already-active"; existing: ActiveSession };

export async function startSession(
  input: StartSessionInput = {},
): Promise<StartSessionResult> {
  const existing = await getActiveSession();
  if (existing) return { ok: false, reason: "already-active", existing };

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
    createdAt: nowIso(),
  };
  await db.sessions.add(session);
  return { ok: true, session, task };
}

// Throws on missing — the three callers below share this precondition.
async function loadSession(id: string) {
  const existing = await db.sessions.get(id);
  if (!existing) throw new Error("Session not found");
  return existing;
}

// Module-private workhorse: the recovery path needs to inject a clipped
// endedAt to bound abandoned-session duration. Public callers always
// close "now" — exposing the second arg on `endSession` would invite
// fabricated timestamps from outside this module.
async function closeSession(
  id: string,
  endedAt: string,
): Promise<ClosedSession> {
  const existing = await loadSession(id);
  if (existing.state === "closed") return existing;

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
    reflection: null,
    createdAt: existing.createdAt,
  };

  await db.sessions.put(closed);
  return closed;
}

// State transition open → closed at the current moment. Idempotent on
// already-closed sessions. Knows nothing about reflections or task
// progress — see the sibling functions below for those.
export async function endSession(id: string): Promise<ClosedSession> {
  return closeSession(id, nowIso());
}

// Annotation on a closed session. Overwrites a prior reflection on
// re-call — the latest tap wins. Throws if called on a still-open session,
// since the lifecycle invariant is "close, then annotate."
export async function recordSessionReflection(
  id: string,
  reflection: SessionReflection,
): Promise<ClosedSession> {
  const existing = await loadSession(id);
  if (existing.state !== "closed") {
    throw new Error("Cannot record reflection on an open session");
  }
  const updated: ClosedSession = { ...existing, reflection };
  await db.sessions.put(updated);
  return updated;
}

// Marks the session's underlying task complete for today. Side effect on
// taskProgress, not on the session row. recordTaskProgress upserts on
// the (taskId+date) unique index, so this is idempotent. No-op when the
// session has no task attached.
export async function markSessionTaskComplete(id: string): Promise<void> {
  const existing = await loadSession(id);
  if (existing.state !== "closed") {
    throw new Error("Cannot mark task complete for an open session");
  }
  if (!existing.taskId) return;
  await recordTaskProgress(existing.taskId, PROGRESS_COMPLETED);
}
