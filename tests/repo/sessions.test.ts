import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { db } from "@/db";
import {
  endSession,
  getActiveSession,
  importSchedule,
  SessionAlreadyActiveError,
  startSession,
} from "@/repo";
import type { ImportScheduleInput } from "@/domain/schedule";

const sampleInput: ImportScheduleInput = {
  title: "Plan",
  targetDate: "2026-05-15",
  cycleLengthDays: 1,
  hoursPerDay: 4,
  timetable: [
    { dayNumber: 1, slots: [{ subject: "Math" }, { subject: "Physics" }] },
  ],
};

async function clearDb() {
  await Promise.all([
    db.schedules.clear(),
    db.tasks.clear(),
    db.taskProgress.clear(),
    db.sessions.clear(),
  ]);
}

describe("session lifecycle", () => {
  beforeEach(async () => {
    // toFake: ['Date'] keeps microtask scheduling on real timers; Dexie
    // hangs otherwise. setTimeout is still faked (default), so
    // advanceTimersByTime works.
    vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout"] });
    vi.setSystemTime(new Date("2026-05-10T00:00:00.000Z"));
    await clearDb();
    await importSchedule(sampleInput);
  });
  afterEach(async () => {
    vi.useRealTimers();
    await clearDb();
  });

  it("starts and recovers an open session", async () => {
    const { session, task } = await startSession();
    expect(session.state).toBe("open");
    expect(task).not.toBeNull();
    const active = await getActiveSession();
    expect(active?.session.id).toBe(session.id);
  });

  it("rejects a second start with SessionAlreadyActiveError carrying the live session", async () => {
    const first = await startSession();
    await expect(startSession()).rejects.toBeInstanceOf(
      SessionAlreadyActiveError,
    );
    try {
      await startSession();
    } catch (err) {
      expect(err).toBeInstanceOf(SessionAlreadyActiveError);
      expect((err as SessionAlreadyActiveError).active.session.id).toBe(
        first.session.id,
      );
    }
  });

  it("transitions an open session to closed via endSession", async () => {
    const { session } = await startSession();
    vi.advanceTimersByTime(60_000);
    const closed = await endSession(session.id, { reflection: "💪" });
    expect(closed.state).toBe("closed");
    expect(closed.duration).toBe(60);
    expect(closed.reflection).toBe("💪");
    expect(await getActiveSession()).toBeNull();
  });

  it("is idempotent on repeated endSession", async () => {
    const { session } = await startSession();
    vi.advanceTimersByTime(60_000);
    const first = await endSession(session.id, { reflection: "🙂" });
    vi.advanceTimersByTime(60_000);
    const second = await endSession(session.id);
    expect(second.endedAt).toBe(first.endedAt);
    expect(second.duration).toBe(first.duration);
    expect(second.reflection).toBe("🙂");
  });

  it("records task completion when markTaskComplete=true", async () => {
    const { session, task } = await startSession();
    expect(task).not.toBeNull();
    vi.advanceTimersByTime(60_000);
    await endSession(session.id, { markTaskComplete: true });
    const progress = await db.taskProgress
      .where("taskId")
      .equals(task!.id)
      .toArray();
    expect(progress).toHaveLength(1);
    expect(progress[0].status).toBe("completed");
    expect(progress[0].date).toBe("2026-05-10");
  });
});
