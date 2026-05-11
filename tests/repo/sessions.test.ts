import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { db } from "@/db";
import {
  endSession,
  getActiveSession,
  importSchedule,
  markSessionTaskComplete,
  recordSessionReflection,
  startSession,
} from "@/repo";
import { RECOVERY_CAP_HOURS } from "@/repo/sessions";
import type { ImportScheduleInput } from "@/domain/schedule";
import { clearDb } from "../helpers";

const sampleInput: ImportScheduleInput = {
  title: "Plan",
  targetDate: "2026-05-15",
  cycleLengthDays: 1,
  hoursPerDay: 4,
  timetable: [
    { dayNumber: 1, slots: [{ subject: "Math" }, { subject: "Physics" }] },
  ],
};

function expectOk<T extends { ok: boolean }>(
  result: T,
): asserts result is Extract<T, { ok: true }> {
  if (!result.ok) throw new Error("expected ok=true result");
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
    const result = await startSession();
    expectOk(result);
    expect(result.session.state).toBe("open");
    expect(result.task).not.toBeNull();
    const active = await getActiveSession();
    expect(active?.session.id).toBe(result.session.id);
  });

  it("returns ok:false with the live session when one is already active", async () => {
    const first = await startSession();
    expectOk(first);
    const second = await startSession();
    expect(second.ok).toBe(false);
    if (!second.ok) {
      expect(second.reason).toBe("already-active");
      expect(second.existing.session.id).toBe(first.session.id);
    }
  });

  it("transitions an open session to closed via endSession", async () => {
    const result = await startSession();
    expectOk(result);
    vi.advanceTimersByTime(60_000);
    const closed = await endSession(result.session.id);
    expect(closed.state).toBe("closed");
    expect(closed.duration).toBe(60);
    expect(closed.reflection).toBeNull();
    expect(await getActiveSession()).toBeNull();
  });

  it("is idempotent on repeated endSession", async () => {
    const result = await startSession();
    expectOk(result);
    vi.advanceTimersByTime(60_000);
    const first = await endSession(result.session.id);
    vi.advanceTimersByTime(60_000);
    const second = await endSession(result.session.id);
    expect(second.endedAt).toBe(first.endedAt);
    expect(second.duration).toBe(first.duration);
  });

  it("recordSessionReflection annotates a closed session", async () => {
    const result = await startSession();
    expectOk(result);
    vi.advanceTimersByTime(60_000);
    await endSession(result.session.id);
    const updated = await recordSessionReflection(result.session.id, "💪");
    expect(updated.reflection).toBe("💪");
  });

  it("recordSessionReflection overwrites on re-call (latest tap wins)", async () => {
    const result = await startSession();
    expectOk(result);
    vi.advanceTimersByTime(60_000);
    await endSession(result.session.id);
    await recordSessionReflection(result.session.id, "💪");
    const updated = await recordSessionReflection(result.session.id, "😩");
    expect(updated.reflection).toBe("😩");
  });

  it("recordSessionReflection throws when session is still open", async () => {
    const result = await startSession();
    expectOk(result);
    await expect(
      recordSessionReflection(result.session.id, "🙂"),
    ).rejects.toThrow(/open session/);
  });

  it("markSessionTaskComplete writes task progress for closed session", async () => {
    const result = await startSession();
    expectOk(result);
    expect(result.task).not.toBeNull();
    vi.advanceTimersByTime(60_000);
    await endSession(result.session.id);
    await markSessionTaskComplete(result.session.id);
    const progress = await db.taskProgress
      .where("taskId")
      .equals(result.task!.id)
      .toArray();
    expect(progress).toHaveLength(1);
    expect(progress[0].status).toBe("completed");
    expect(progress[0].date).toBe("2026-05-10");
  });

  it("markSessionTaskComplete is idempotent", async () => {
    const result = await startSession();
    expectOk(result);
    vi.advanceTimersByTime(60_000);
    await endSession(result.session.id);
    await markSessionTaskComplete(result.session.id);
    await markSessionTaskComplete(result.session.id);
    const progress = await db.taskProgress
      .where("taskId")
      .equals(result.task!.id)
      .toArray();
    expect(progress).toHaveLength(1);
  });

  it("markSessionTaskComplete throws when session is still open", async () => {
    const result = await startSession();
    expectOk(result);
    await expect(
      markSessionTaskComplete(result.session.id),
    ).rejects.toThrow(/open session/);
  });

  // The #38 fix's core invariant: closing the tab between Stop and
  // emoji-pick no longer leaks an open row. Stop closes the row
  // immediately; if the user never gets to a reflection, the session is
  // simply unreflected.
  it("Stop → tab-close → resume → no open session is adopted", async () => {
    const result = await startSession();
    expectOk(result);
    vi.advanceTimersByTime(60_000);
    await endSession(result.session.id); // user pressed Stop
    // (simulate tab-close: no recordSessionReflection call)
    vi.advanceTimersByTime(24 * 3600_000);
    expect(await getActiveSession()).toBeNull();
  });

  it("getActiveSession auto-closes an abandoned-active session past the cap and clips duration", async () => {
    const result = await startSession();
    expectOk(result);
    // No Stop, no reflection — user just closed the tab and came back days later.
    vi.advanceTimersByTime(5 * 24 * 3600_000);
    const active = await getActiveSession();
    expect(active).toBeNull();
    const row = await db.sessions.get(result.session.id);
    expect(row?.state).toBe("closed");
    if (row?.state === "closed") {
      // Duration is clipped to exactly the cap — not the multi-day delta
      // between startedAt and "discovery." Otherwise the dashboard's
      // hours-studied aggregate would absorb the junk.
      expect(row.duration).toBe(RECOVERY_CAP_HOURS * 3600);
    }
  });

  it("getActiveSession still adopts a session within the recovery cap", async () => {
    const result = await startSession();
    expectOk(result);
    vi.advanceTimersByTime((RECOVERY_CAP_HOURS - 1) * 3600_000);
    const active = await getActiveSession();
    expect(active?.session.id).toBe(result.session.id);
  });
});
