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

    it("creates progress for in_progress task", () => {
      const result = CreateTaskProgressSchema.safeParse({
        taskId: "task-123",
        status: "in_progress",
        notes: "Halfway through chapter 2",
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

    it("accepts any non-empty string as status (no enum validation in schema)", () => {
      const result = CreateTaskProgressSchema.safeParse({
        taskId: "task-123",
        status: "unknown_status",
      });
      expect(result.success).toBe(true);
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

    it("accepts all valid status values", () => {
      const statuses = ["pending", "in_progress", "completed", "skipped", "blocked"];
      for (const status of statuses) {
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
        status: "in_progress",
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
    it("simulates task progress through states", () => {
      const pending = CreateTaskProgressSchema.safeParse({
        taskId: "task-abc",
        status: "pending",
      });
      expect(pending.success).toBe(true);

      const inProgress = UpdateTaskProgressSchema.safeParse({
        status: "in_progress",
        notes: "Started working on this",
      });
      expect(inProgress.success).toBe(true);

      const completed = UpdateTaskProgressSchema.safeParse({
        status: "completed",
        notes: "All topics covered",
      });
      expect(completed.success).toBe(true);
    });

    it("task can be marked skipped", () => {
      const skipped = CreateTaskProgressSchema.safeParse({
        taskId: "task-def",
        status: "skipped",
        notes: "Not relevant for current study plan",
      });
      expect(skipped.success).toBe(true);
    });

    it("task can be blocked then unblocked", () => {
      const blocked = UpdateTaskProgressSchema.safeParse({
        status: "blocked",
        notes: "Waiting for prerequisite material",
      });
      expect(blocked.success).toBe(true);

      const unblocked = UpdateTaskProgressSchema.safeParse({
        status: "in_progress",
        notes: "Prerequisites completed",
      });
      expect(unblocked.success).toBe(true);
    });
  });
});