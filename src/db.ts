import Dexie, { type Table } from "dexie";
import type { ImportScheduleInput } from "@/domain/schedule";
import type { TaskProgressStatus } from "@/domain/progress";
import type { OpenSession, ClosedSession } from "@/domain/session";

export interface TaskProgressRecord {
  id: string;
  taskId: string;
  date: string;
  status: TaskProgressStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleRecord {
  id: string;
  createdAt: string;
  title: string;
  targetDate: string;
  data: ImportScheduleInput;
  hoursPerDay: number;
}

export interface TaskRecord {
  id: string;
  createdAt: string;
  scheduleId: string;
  title: string;
  subject: string;
  targetDate: string;
  priority: number;
}

export type SessionRecord = OpenSession | ClosedSession;

// One row per calendar day — date is the primary key, no surrogate
// UUID, because daily aggregate identity *is* the date.
export interface McqLogRecord {
  date: string;
  count: number;
}

class LakshyaDB extends Dexie {
  schedules!: Table<ScheduleRecord, string>;
  tasks!: Table<TaskRecord, string>;
  taskProgress!: Table<TaskProgressRecord, string>;
  sessions!: Table<SessionRecord, string>;
  mcqLogs!: Table<McqLogRecord, string>;

  constructor() {
    super("lakshya");
    this.version(1).stores({
      schedules: "id, createdAt",
      tasks: "id, scheduleId, [scheduleId+targetDate], targetDate",
      taskProgress: "id, &[taskId+date], taskId, date",
      sessions: "id, startedAt, state",
    });
    // v2: session timer becomes a stopwatch — `focusMinutes` is no
    // longer a meaningful target. Strip it from rows on disk so the
    // type (no `focusMinutes`) matches storage; old closed sessions
    // keep their `duration`, which is the sole authoritative time.
    this.version(2).upgrade((tx) =>
      tx
        .table("sessions")
        .toCollection()
        .modify((s) => {
          delete s.focusMinutes;
        }),
    );
    // Dexie's `.stores()` is the full schema for a version, not a
    // delta — every prior store must be repeated.
    this.version(3).stores({
      schedules: "id, createdAt",
      tasks: "id, scheduleId, [scheduleId+targetDate], targetDate",
      taskProgress: "id, &[taskId+date], taskId, date",
      sessions: "id, startedAt, state",
      mcqLogs: "date",
    });
  }
}

export const db = new LakshyaDB();

export function newId(): string {
  // crypto.randomUUID is only exposed in secure contexts (https or
  // localhost). Over LAN / plain http it's undefined, so fall back to
  // an RFC 4122 v4 built from getRandomValues, which is universally
  // available.
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
