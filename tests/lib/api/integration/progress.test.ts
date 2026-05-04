import { describe, it, expect } from "vitest";
import {
  CreateTaskProgressSchema,
  UpdateTaskProgressSchema,
  TaskProgressQuerySchema,
} from "@/lib/api/progress/schemas";

describe("Progress Integration Tests", () => {
  describe("CreateTaskProgressSchema - full workflow", () => {
    it("creates progress for completed task", () => {
      const result = CreateTaskProgressSchema.safeParse({
        taskId: "task-123",
        status: "completed",
        notes: "Finished reading all sections",
        date: "2026-04-24T10:00:00.000Z",
      });
      expect(result.success).toBe(true);
    });

    it("creates progress for pending task", () => {
      const result = CreateTaskProgressSchema.safeParse({
        taskId: "task-123",
        status: "pending",
        notes: "Started but not finished",
      });
      expect(result.success).toBe(true);
    });

    it("creates minimal progress record", () => {
      const result = CreateTaskProgressSchema.safeParse({
        taskId: "task-123",
        status: "pending",
      });
      expect(result.success).toBe(true);
    });

    it("rejects unknown status values", () => {
      const result = CreateTaskProgressSchema.safeParse({
        taskId: "task-123",
        status: "unknown_status",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing taskId", () => {
      const result = CreateTaskProgressSchema.safeParse({
        status: "completed",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty taskId", () => {
      const result = CreateTaskProgressSchema.safeParse({
        taskId: "",
        status: "completed",
      });
      expect(result.success).toBe(false);
    });

    it("accepts the supported status values", () => {
      for (const status of ["pending", "completed"] as const) {
        const result = CreateTaskProgressSchema.safeParse({
          taskId: "task-123",
          status,
        });
        expect(result.success).toBe(true);
      }
    });

    it("rejects invalid date format", () => {
      const result = CreateTaskProgressSchema.safeParse({
        taskId: "task-123",
        status: "completed",
        date: "2026-04-24",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("UpdateTaskProgressSchema - partial updates", () => {
    it("updates status only", () => {
      const result = UpdateTaskProgressSchema.safeParse({
        status: "completed",
      });
      expect(result.success).toBe(true);
    });

    it("updates notes only", () => {
      const result = UpdateTaskProgressSchema.safeParse({
        notes: "Updated completion notes",
      });
      expect(result.success).toBe(true);
    });

    it("accepts empty update (no-op)", () => {
      const result = UpdateTaskProgressSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("updates both status and notes", () => {
      const result = UpdateTaskProgressSchema.safeParse({
        status: "completed",
        notes: "All sections completed successfully",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty status string", () => {
      const result = UpdateTaskProgressSchema.safeParse({
        status: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("TaskProgressQuerySchema - query patterns", () => {
    it("query by taskId", () => {
      const result = TaskProgressQuerySchema.safeParse({
        taskId: "task-123",
        take: "50",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.taskId).toBe("task-123");
      }
    });

    it("query by date range", () => {
      const result = TaskProgressQuerySchema.safeParse({
        date: "2026-04-24T00:00:00.000Z",
        take: "20",
      });
      expect(result.success).toBe(true);
    });

    it("default pagination", () => {
      const result = TaskProgressQuerySchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe("Progress workflow - task lifecycle", () => {
    it("simulates pending → completed lifecycle", () => {
      const pending = CreateTaskProgressSchema.safeParse({
        taskId: "task-abc",
        status: "pending",
      });
      expect(pending.success).toBe(true);

      const completed = UpdateTaskProgressSchema.safeParse({
        status: "completed",
        notes: "All topics covered",
      });
      expect(completed.success).toBe(true);
    });

    it("rejects extended states like skipped/blocked", () => {
      for (const status of ["skipped", "blocked", "in_progress"]) {
        const result = CreateTaskProgressSchema.safeParse({
          taskId: "task-def",
          status,
        });
        expect(result.success).toBe(false);
      }
    });
  });
});