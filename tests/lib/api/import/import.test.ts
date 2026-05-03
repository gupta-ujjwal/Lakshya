import { describe, it, expect } from "vitest";
import { ImportScheduleSchema, type ImportScheduleInput } from "@/lib/api/schedules/schemas";
import { generateTasksFromSchedule, getSampleSchedule, MAX_DAYS } from "@/lib/api/schedules/ingest";

describe("Import Schedule API", () => {
  describe("ImportScheduleSchema validation", () => {
    it("validates a complete schedule with timetable", () => {
      const result = ImportScheduleSchema.safeParse({
        title: "NEET PG 2026 Study Plan",
        description: "6-month comprehensive preparation",
        targetDate: "2026-10-26",
        cycleLengthDays: 7,
        timetable: [
          {
            dayNumber: 1,
            slots: [
              { subject: "Anatomy", topic: "Upper Limb" },
            ],
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("rejects schedule without title", () => {
      const result = ImportScheduleSchema.safeParse({
        targetDate: "2026-10-26",
        cycleLengthDays: 7,
        timetable: [],
      });
      expect(result.success).toBe(false);
    });

    it("rejects cycleLengthDays out of range (too high)", () => {
      const result = ImportScheduleSchema.safeParse({
        title: "Test Plan",
        targetDate: "2026-10-26",
        cycleLengthDays: 400,
        timetable: [{ dayNumber: 1, slots: [] }],
      });
      expect(result.success).toBe(false);
    });

    it("accepts schedule without description", () => {
      const result = ImportScheduleSchema.safeParse({
        title: "Test Plan",
        targetDate: "2026-10-26",
        cycleLengthDays: 7,
        timetable: [{ dayNumber: 1, slots: [] }],
      });
      expect(result.success).toBe(true);
    });

    it("accepts optional topic field in slots", () => {
      const result = ImportScheduleSchema.safeParse({
        title: "Test Plan",
        targetDate: "2026-10-26",
        cycleLengthDays: 7,
        timetable: [
          {
            dayNumber: 1,
            slots: [{ subject: "Math", topic: "Algebra" }],
          },
        ],
      });
      expect(result.success).toBe(true);
    });
  });

  describe("generateTasksFromSchedule", () => {
    const validSchedule: ImportScheduleInput = {
      title: "Test Schedule",
      targetDate: new Date(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] + "T00:00:00.000Z"),
      cycleLengthDays: 7,
      timetable: [
        {
          dayNumber: 1,
          slots: [{ subject: "Math", topic: "Algebra" }],
        },
        {
          dayNumber: 2,
          slots: [{ subject: "Science", topic: "Biology" }],
        },
        {
          dayNumber: 3,
          slots: [{ subject: "History" }],
        },
      ],
    };

    it("generates tasks for each day in the schedule", () => {
      const tasks = generateTasksFromSchedule(validSchedule);
      expect(tasks.length).toBeGreaterThan(0);
    });

    it("assigns correct subject to tasks", () => {
      const tasks = generateTasksFromSchedule(validSchedule);
      const mathTasks = tasks.filter((t) => t.subject === "Math");
      expect(mathTasks.length).toBeGreaterThan(0);
    });

    it("assigns title from topic or subject", () => {
      const tasks = generateTasksFromSchedule(validSchedule);
      const algebraTask = tasks.find((t) => t.title === "Algebra");
      expect(algebraTask).toBeDefined();
    });

    it("returns empty array for past target dates", () => {
      const pastSchedule: ImportScheduleInput = {
        ...validSchedule,
        targetDate: new Date("2020-01-01T00:00:00.000Z"),
      };
      const tasks = generateTasksFromSchedule(pastSchedule);
      expect(tasks).toHaveLength(0);
    });

    it("returns empty array for empty timetable", () => {
      const emptyTimetable: ImportScheduleInput = {
        ...validSchedule,
        timetable: [],
      };
      const tasks = generateTasksFromSchedule(emptyTimetable);
      expect(tasks).toHaveLength(0);
    });

    it("caps tasks at MAX_DAYS", () => {
      const farFuture: ImportScheduleInput = {
        ...validSchedule,
        targetDate: new Date(new Date(Date.now() + 1000 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] + "T00:00:00.000Z"),
      };
      const tasks = generateTasksFromSchedule(farFuture);
      expect(tasks.length).toBeLessThanOrEqual(MAX_DAYS * 2);
    });
  });

  describe("getSampleSchedule", () => {
    it("returns a valid schedule input", () => {
      const sample = getSampleSchedule();
      expect(sample.targetDate instanceof Date).toBe(true);
    });

    it("has a target date at least 180 days in the future", () => {
      const sample = getSampleSchedule();
      const targetDate = new Date(sample.targetDate);
      const now = new Date();
      const daysDiff = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBeGreaterThanOrEqual(179);
    });

    it("has 7-day cycle", () => {
      const sample = getSampleSchedule();
      expect(sample.cycleLengthDays).toBe(7);
    });

    it("has all days of week defined", () => {
      const sample = getSampleSchedule();
      expect(sample.timetable).toHaveLength(7);
    });
  });
});