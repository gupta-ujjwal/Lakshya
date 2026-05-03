import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ImportScheduleSchema,
  ImportScheduleInput,
} from "../../../../lib/api/schedules/schemas";
import { generateTasksFromSchedule, importSchedule } from "../../../../lib/api/schedules/ingest";
import { prisma } from "@/lib/prisma";
import { readFileSync } from "fs";

vi.mock("@/lib/prisma", () => {
  const mockPrisma = {
    $transaction: vi.fn(),
    user: {
      upsert: vi.fn(),
    },
    schedule: {
      create: vi.fn(),
    },
    task: {
      createMany: vi.fn(),
    },
  };
  return { prisma: mockPrisma };
});

describe("Schedule Import", () => {
  describe("ImportScheduleSchema", () => {
    it("validates valid schedule input", () => {
      const input = {
        title: "NEET PG 2026 Prep",
        description: "Full syllabus coverage",
        targetDate: "2026-12-31",
        cycleLengthDays: 7,
        timetable: [
          {
            dayNumber: 1,
            slots: [
              { subject: "Anatomy", topic: "Upper Limb" },
              { subject: "Physiology" },
            ],
          },
        ],
      };
      expect(ImportScheduleSchema.safeParse(input).success).toBe(true);
    });

    it("requires title", () => {
      const input = {
        targetDate: "2026-12-31",
        cycleLengthDays: 7,
        timetable: [],
      };
      expect(ImportScheduleSchema.safeParse(input).success).toBe(false);
    });

    it("requires positive cycleLengthDays", () => {
      const input = {
        title: "Test",
        targetDate: "2026-12-31",
        cycleLengthDays: 0,
        timetable: [],
      };
      expect(ImportScheduleSchema.safeParse(input).success).toBe(false);
    });

    it("validates timetable structure", () => {
      const input = {
        title: "Test",
        targetDate: "2026-12-31",
        cycleLengthDays: 1,
        timetable: [
          {
            dayNumber: 1,
            slots: [{ subject: "Physics", topic: "Mechanics" }],
          },
        ],
      };
      const result = ImportScheduleSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.timetable[0].slots[0].subject).toBe("Physics");
      }
    });
  });

  describe("generateTasksFromSchedule", () => {
    const baseSchedule: ImportScheduleInput = {
      title: "Test Schedule",
      targetDate: new Date("2026-12-31T00:00:00.000Z"),
      cycleLengthDays: 2,
      timetable: [
        {
          dayNumber: 1,
          slots: [{ subject: "Physics", topic: "Chapter 1" }],
        },
        {
          dayNumber: 2,
          slots: [{ subject: "Chemistry", topic: "Chapter 1" }],
        },
      ],
    };

    it("generates tasks for days in the schedule", () => {
      const startDate = new Date("2026-01-01");
      const tasks = generateTasksFromSchedule(baseSchedule, startDate);
      expect(tasks.length).toBeGreaterThan(0);
    });

    it("generates tasks for days with slots", () => {
      const tasks = generateTasksFromSchedule(baseSchedule);
      const physicsTasks = tasks.filter(
        (t) => t.subject === "Physics" && t.title.includes("Chapter 1")
      );
      const chemTasks = tasks.filter(
        (t) => t.subject === "Chemistry" && t.title.includes("Chapter 1")
      );
      expect(physicsTasks.length).toBeGreaterThan(0);
      expect(chemTasks.length).toBeGreaterThan(0);
    });

    it("handles empty timetable", () => {
      const emptySchedule: ImportScheduleInput = {
        ...baseSchedule,
        timetable: [],
      };
      const tasks = generateTasksFromSchedule(emptySchedule);
      expect(tasks.length).toBe(0);
    });

    it("caps tasks at MAX_DAYS (730)", () => {
      const longSchedule: ImportScheduleInput = {
        ...baseSchedule,
        targetDate: new Date("2030-01-01T00:00:00.000Z"),
      };
      const tasks = generateTasksFromSchedule(longSchedule);
      expect(tasks.length).toBeLessThanOrEqual(730);
    });

    it("returns empty array for past target dates", () => {
      const pastSchedule: ImportScheduleInput = {
        ...baseSchedule,
        targetDate: new Date("2020-01-01T00:00:00.000Z"),
      };
      const tasks = generateTasksFromSchedule(pastSchedule);
      expect(tasks.length).toBe(0);
    });

    it("prioritizes earlier slots with lower priority number", () => {
      const schedule: ImportScheduleInput = {
        title: "Test",
        targetDate: new Date("2026-12-31T00:00:00.000Z"),
        cycleLengthDays: 1,
        timetable: [
          {
            dayNumber: 1,
            slots: [
              { subject: "Physics", topic: "First" },
              { subject: "Chemistry", topic: "Second" },
            ],
          },
        ],
      };
      const tasks = generateTasksFromSchedule(schedule);
      const firstTasks = tasks.filter((t) => t.title.includes("First"));
      const secondTasks = tasks.filter((t) => t.title.includes("Second"));

      if (firstTasks.length > 0 && secondTasks.length > 0) {
        expect(firstTasks[0].priority).toBeLessThan(secondTasks[0].priority);
      }
    });

    it("generates tasks for 112-day cycle schedule (btr_schedule.json)", () => {
      const btrSchedule: ImportScheduleInput = JSON.parse(
        readFileSync("./btr_schedule.json", "utf-8")
      );
      expect(ImportScheduleSchema.safeParse(btrSchedule).success).toBe(true);
      const tasks = generateTasksFromSchedule(btrSchedule);
      expect(tasks.length).toBeGreaterThan(0);
      expect(tasks.length).toBeLessThanOrEqual(730 * 2);
    });

    it("handles invalid targetDate string (rejects it)", () => {
      const invalidSchedule = {
        title: "Test",
        targetDate: "invalid-date",
        cycleLengthDays: 7,
        timetable: [{ dayNumber: 1, slots: [{ subject: "Test" }] }],
      };
      expect(ImportScheduleSchema.safeParse(invalidSchedule).success).toBe(false);
    });

    it("generates tasks when targetDate is today (timezone fix)", () => {
      const todayStr = new Date().toISOString().split("T")[0];
      const todaySchedule: ImportScheduleInput = {
        title: "Today",
        targetDate: new Date(`${todayStr}T00:00:00.000Z`),
        cycleLengthDays: 7,
        timetable: [{ dayNumber: 1, slots: [{ subject: "Test", topic: "Today topic" }] }],
      };
      const tasks = generateTasksFromSchedule(todaySchedule);
      expect(tasks.length).toBeGreaterThan(0);
    });
  });

  describe("importSchedule", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("ensures user exists before creating schedule (foreign key constraint fix)", async () => {
      const mockSchedule = {
        id: "schedule-123",
        title: "Test Schedule",
        targetDate: new Date("2026-12-31"),
        userId: "user-abc",
        data: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(async (callback) => {
        return callback(prisma);
      });
      (prisma.user.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "user-abc" });
      (prisma.schedule.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockSchedule);
      (prisma.task.createMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 5 });

      const input: ImportScheduleInput = {
        title: "Test Schedule",
        targetDate: new Date("2026-12-31T00:00:00.000Z"),
        cycleLengthDays: 7,
        timetable: [
          { dayNumber: 1, slots: [{ subject: "Physics", topic: "Chapter 1" }] },
        ],
      };

      const result = await importSchedule("user-abc", input);

      expect(result.success).toBe(true);
      expect(prisma.user.upsert).toHaveBeenCalledWith({
        where: { id: "user-abc" },
        create: { id: "user-abc" },
        update: {},
      });
      expect(prisma.schedule.create).toHaveBeenCalled();
    });

    it("creates schedule even when user doesn't exist initially (foreign key constraint test)", async () => {
      let userUpsertCalled = false;
      let scheduleCreateCalled = false;

      (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(async (callback) => {
        const tx = prisma;
        userUpsertCalled = false;
        scheduleCreateCalled = false;

        const originalUpsert = tx.user.upsert as ReturnType<typeof vi.fn>;
        const originalCreate = tx.schedule.create as ReturnType<typeof vi.fn>;

        (tx.user.upsert as ReturnType<typeof vi.fn>).mockImplementation(async () => {
          userUpsertCalled = true;
          return { id: "new-user-456" };
        });

        (tx.schedule.create as ReturnType<typeof vi.fn>).mockImplementation(async (args: any) => {
          scheduleCreateCalled = true;
          if (!userUpsertCalled) {
            throw new Error("Schedule create called before user upsert - foreign key would fail!");
          }
          return {
            id: "schedule-new",
            title: args.data.title,
            targetDate: args.data.targetDate,
            userId: args.data.userId,
            data: args.data.data,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        });

        try {
          return await callback(tx);
        } finally {
          tx.user.upsert = originalUpsert;
          tx.schedule.create = originalCreate;
        }
      });

      const input: ImportScheduleInput = {
        title: "New User Schedule",
        targetDate: new Date("2026-12-31T00:00:00.000Z"),
        cycleLengthDays: 1,
        timetable: [{ dayNumber: 1, slots: [{ subject: "Test" }] }],
      };

      const result = await importSchedule("new-user-456", input);

      expect(result.success).toBe(true);
      expect(userUpsertCalled).toBe(true);
      expect(scheduleCreateCalled).toBe(true);
    });

    it("returns error when transaction fails", async () => {
      (prisma.$transaction as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Database connection failed")
      );

      const input: ImportScheduleInput = {
        title: "Test",
        targetDate: new Date("2026-12-31T00:00:00.000Z"),
        cycleLengthDays: 7,
        timetable: [{ dayNumber: 1, slots: [{ subject: "Test" }] }],
      };

      const result = await importSchedule("user-xyz", input);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Database connection failed");
    });
  });
});