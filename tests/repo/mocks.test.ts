import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { db } from "@/db";
import { addMock, deleteMock, listMocks, weakSubjects } from "@/repo";
import { clearDb } from "../helpers";

describe("mock-test repo", () => {
  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout"] });
    vi.setSystemTime(new Date("2026-05-12T08:00:00.000Z"));
    await clearDb();
  });
  afterEach(async () => {
    vi.useRealTimers();
    await clearDb();
  });

  describe("addMock + listMocks", () => {
    it("addMock writes a row that listMocks reads back", async () => {
      const written = await addMock({
        series: "marrow",
        date: "2026-05-12",
        subjectScores: { Anatomy: 70, Physiology: 60 },
        total: 65,
      });
      const all = await listMocks();
      expect(all).toHaveLength(1);
      expect(all[0]).toMatchObject({
        id: written.id,
        series: "marrow",
        date: "2026-05-12",
        subjectScores: { Anatomy: 70, Physiology: 60 },
        total: 65,
      });
    });

    it("addMock generates id and createdAt", async () => {
      const written = await addMock({
        series: "prepladder",
        date: "2026-05-12",
        subjectScores: { Pathology: 80 },
        total: 80,
      });
      expect(written.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(written.createdAt).toBe("2026-05-12T08:00:00.000Z");
    });

    it("addMock clamps per-subject scores to [0, 100]", async () => {
      const written = await addMock({
        series: "dams",
        date: "2026-05-12",
        subjectScores: { Anatomy: 150, Physiology: -10, Pathology: 75 },
        total: 75,
      });
      expect(written.subjectScores).toEqual({
        Anatomy: 100,
        Physiology: 0,
        Pathology: 75,
      });
    });

    it("addMock clamps total the same way", async () => {
      const written = await addMock({
        series: "other",
        date: "2026-05-12",
        subjectScores: { Anatomy: 50 },
        total: 999,
      });
      expect(written.total).toBe(100);
    });

    it("addMock coerces NaN scores to 0", async () => {
      const written = await addMock({
        series: "marrow",
        date: "2026-05-12",
        subjectScores: { Anatomy: NaN, Physiology: 50 },
        total: NaN,
      });
      expect(written.subjectScores.Anatomy).toBe(0);
      expect(written.total).toBe(0);
    });

    it("listMocks orders newest-date first, createdAt as tie-break", async () => {
      vi.setSystemTime(new Date("2026-05-10T08:00:00.000Z"));
      await addMock({
        series: "marrow",
        date: "2026-05-10",
        subjectScores: { Anatomy: 70 },
        total: 70,
      });
      vi.setSystemTime(new Date("2026-05-12T08:00:00.000Z"));
      const second = await addMock({
        series: "marrow",
        date: "2026-05-12",
        subjectScores: { Anatomy: 80 },
        total: 80,
      });
      vi.setSystemTime(new Date("2026-05-12T09:00:00.000Z"));
      const third = await addMock({
        series: "prepladder",
        date: "2026-05-12",
        subjectScores: { Anatomy: 60 },
        total: 60,
      });
      const all = await listMocks();
      expect(all.map((m) => m.id)).toEqual([third.id, second.id, /* oldest */ all[2].id]);
      expect(all[2].date).toBe("2026-05-10");
    });
  });

  describe("deleteMock", () => {
    it("removes the row by id", async () => {
      const a = await addMock({
        series: "marrow",
        date: "2026-05-12",
        subjectScores: { Anatomy: 70 },
        total: 70,
      });
      const b = await addMock({
        series: "prepladder",
        date: "2026-05-12",
        subjectScores: { Pathology: 80 },
        total: 80,
      });
      await deleteMock(a.id);
      const all = await listMocks();
      expect(all).toHaveLength(1);
      expect(all[0].id).toBe(b.id);
    });

    it("is a no-op when the id doesn't exist", async () => {
      await addMock({
        series: "marrow",
        date: "2026-05-12",
        subjectScores: { Anatomy: 70 },
        total: 70,
      });
      await deleteMock("nonexistent-id");
      expect(await db.mockTests.count()).toBe(1);
    });
  });

  describe("weakSubjects", () => {
    it("returns [] when no mocks exist", async () => {
      expect(await weakSubjects(3)).toEqual([]);
    });

    it("returns [] for n <= 0 or non-finite n", async () => {
      await addMock({
        series: "marrow",
        date: "2026-05-12",
        subjectScores: { Anatomy: 50, Physiology: 50 },
        total: 50,
      });
      await addMock({
        series: "marrow",
        date: "2026-05-11",
        subjectScores: { Anatomy: 50, Physiology: 50 },
        total: 50,
      });
      expect(await weakSubjects(0)).toEqual([]);
      expect(await weakSubjects(-3)).toEqual([]);
      expect(await weakSubjects(NaN)).toEqual([]);
    });

    it("excludes subjects appearing in fewer than 2 mocks", async () => {
      await addMock({
        series: "marrow",
        date: "2026-05-12",
        subjectScores: { Anatomy: 90, Physiology: 30 },
        total: 60,
      });
      await addMock({
        series: "marrow",
        date: "2026-05-11",
        subjectScores: { Anatomy: 90, Pathology: 10 },
        total: 50,
      });
      // Anatomy appears in both → eligible (mean 90)
      // Physiology appears in 1 → excluded despite low score
      // Pathology appears in 1 → excluded despite lowest score
      expect(await weakSubjects(5)).toEqual(["Anatomy"]);
    });

    it("ranks eligible subjects by lowest mean first", async () => {
      // Two mocks each touching three subjects; clear ranking by mean.
      await addMock({
        series: "marrow",
        date: "2026-05-12",
        subjectScores: { Anatomy: 80, Physiology: 50, Pathology: 30 },
        total: 53,
      });
      await addMock({
        series: "marrow",
        date: "2026-05-11",
        subjectScores: { Anatomy: 90, Physiology: 60, Pathology: 40 },
        total: 63,
      });
      // Means: Pathology 35, Physiology 55, Anatomy 85.
      expect(await weakSubjects(3)).toEqual([
        "Pathology",
        "Physiology",
        "Anatomy",
      ]);
    });

    it("respects n and returns at most n subjects", async () => {
      await addMock({
        series: "marrow",
        date: "2026-05-12",
        subjectScores: { Anatomy: 80, Physiology: 50, Pathology: 30 },
        total: 53,
      });
      await addMock({
        series: "marrow",
        date: "2026-05-11",
        subjectScores: { Anatomy: 90, Physiology: 60, Pathology: 40 },
        total: 63,
      });
      expect(await weakSubjects(2)).toEqual(["Pathology", "Physiology"]);
      expect(await weakSubjects(1)).toEqual(["Pathology"]);
    });

    it("clamps n to 50 (Tenet 3 — bound the result)", async () => {
      // Build two mocks each covering 60 subjects so the call doesn't
      // get clamped by "eligible.length" before the n-cap.
      const subjects: Record<string, number> = {};
      for (let i = 0; i < 60; i++) subjects[`Subj${i}`] = i;
      await addMock({
        series: "marrow",
        date: "2026-05-12",
        subjectScores: subjects,
        total: 30,
      });
      await addMock({
        series: "marrow",
        date: "2026-05-11",
        subjectScores: subjects,
        total: 30,
      });
      const result = await weakSubjects(1000);
      expect(result.length).toBe(50);
    });

    it("only considers the most recent 5 mocks", async () => {
      // Six mocks — the oldest should not influence weakSubjects.
      for (let i = 0; i < 6; i++) {
        await addMock({
          series: "marrow",
          date: `2026-05-${String(10 + i).padStart(2, "0")}`,
          subjectScores: { Anatomy: 50, Physiology: 50 },
          total: 50,
        });
      }
      // Add a poison mock as the OLDEST → outside the 5-window.
      await addMock({
        series: "marrow",
        date: "2026-05-09",
        subjectScores: { Anatomy: 0, Physiology: 0 },
        total: 0,
      });
      const result = await weakSubjects(2);
      // Both eligible subjects' means come from the 5 recent mocks at
      // 50; tie-break alphabetic. Poison row excluded.
      expect(result).toEqual(["Anatomy", "Physiology"]);
    });

    it("tie-breaks equal means alphabetically by subject name", async () => {
      await addMock({
        series: "marrow",
        date: "2026-05-12",
        subjectScores: { Zebra: 50, Alpha: 50, Mango: 50 },
        total: 50,
      });
      await addMock({
        series: "marrow",
        date: "2026-05-11",
        subjectScores: { Zebra: 50, Alpha: 50, Mango: 50 },
        total: 50,
      });
      expect(await weakSubjects(3)).toEqual(["Alpha", "Mango", "Zebra"]);
    });
  });
});
