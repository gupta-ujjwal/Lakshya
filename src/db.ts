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

class LakshyaDB extends Dexie {
  schedules!: Table<ScheduleRecord, string>;
  tasks!: Table<TaskRecord, string>;
  taskProgress!: Table<TaskProgressRecord, string>;
  sessions!: Table<SessionRecord, string>;

  constructor() {
    super("lakshya");
    this.version(1).stores({
      schedules: "id, createdAt",
      tasks: "id, scheduleId, [scheduleId+targetDate], targetDate",
      taskProgress: "id, &[taskId+date], taskId, date",
      sessions: "id, startedAt, state",
    });
  }
}

export const db = new LakshyaDB();

export function newId(): string {
  return crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}
