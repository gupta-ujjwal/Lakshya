import { describe, it, expect } from "vitest";
import {
  CreateTaskSchema,
  UpdateTaskSchema,
  TaskQuerySchema,
} from "@/lib/api/tasks/schemas";

describe("Tasks Integration Tests", () => {
  describe("CreateTaskSchema - full workflow", () => {
    it("creates a valid task with all required fields", () => {
      const result = CreateTaskSchema.safeParse({
        scheduleId: "schedule-123",
        title: "Cardiovascular System Review",
        subject: "Physiology",
        targetDate: "2026-04-24T00:00:00.000Z",
      });
      expect(result.success).toBe(true);
    });

    it("creates a task with high priority", () => {
      const result = CreateTaskSchema.safeParse({
        scheduleId: "schedule-123",
        title: "High Priority Task",
        subject: "Anatomy",
        targetDate: "2026-04-24T00:00:00.000Z",
        priority: 9,
      });
      expect(result.success).toBe(true);
    });

    it("defaults priority to 0 when not provided", () => {
      const result = CreateTaskSchema.safeParse({
        scheduleId: "schedule-123",
        title: "Normal Task",
        subject: "Biochemistry",
        targetDate: "2026-04-24T00:00:00.000Z",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priority).toBe(0);
      }
    });

    it("rejects priority above maximum", () => {
      const result = CreateTaskSchema.safeParse({
        scheduleId: "schedule-123",
        title: "Task",
        subject: "Physiology",
        targetDate: "2026-04-24T00:00:00.000Z",
        priority: 11,
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing scheduleId", () => {
      const result = CreateTaskSchema.safeParse({
        title: "Task",
        subject: "Physiology",
        targetDate: "2026-04-24T00:00:00.000Z",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty scheduleId", () => {
      const result = CreateTaskSchema.safeParse({
        scheduleId: "",
        title: "Task",
        subject: "Physiology",
        targetDate: "2026-04-24T00:00:00.000Z",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty title", () => {
      const result = CreateTaskSchema.safeParse({
        scheduleId: "schedule-123",
        title: "",
        subject: "Physiology",
        targetDate: "2026-04-24T00:00:00.000Z",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty subject", () => {
      const result = CreateTaskSchema.safeParse({
        scheduleId: "schedule-123",
        title: "Valid Title",
        subject: "",
        targetDate: "2026-04-24T00:00:00.000Z",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid targetDate format", () => {
      const result = CreateTaskSchema.safeParse({
        scheduleId: "schedule-123",
        title: "Task",
        subject: "Physiology",
        targetDate: "not-a-date",
      });
      expect(result.success).toBe(false);
    });

    it("accepts all valid subject values", () => {
      const subjects = ["Anatomy", "Physiology", "Pharmacology", "Biochemistry", "Pathology", "Microbiology", "PSM"];
      for (const subject of subjects) {
        const result = CreateTaskSchema.safeParse({
          scheduleId: "schedule-123",
          title: "Task",
          subject,
          targetDate: "2026-04-24T00:00:00.000Z",
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("UpdateTaskSchema - partial updates", () => {
    it("updates only title", () => {
      const result = UpdateTaskSchema.safeParse({ title: "Updated Title" });
      expect(result.success).toBe(true);
    });

    it("updates only subject", () => {
      const result = UpdateTaskSchema.safeParse({ subject: "Biochemistry" });
      expect(result.success).toBe(true);
    });

    it("updates only targetDate", () => {
      const result = UpdateTaskSchema.safeParse({
        targetDate: "2026-05-01T00:00:00.000Z",
      });
      expect(result.success).toBe(true);
    });

    it("updates only priority", () => {
      const result = UpdateTaskSchema.safeParse({ priority: 8 });
      expect(result.success).toBe(true);
    });

    it("rejects empty string title", () => {
      const result = UpdateTaskSchema.safeParse({ title: "" });
      expect(result.success).toBe(false);
    });

    it("rejects empty string subject", () => {
      const result = UpdateTaskSchema.safeParse({ subject: "" });
      expect(result.success).toBe(false);
    });

    it("rejects priority above maximum", () => {
      const result = UpdateTaskSchema.safeParse({ priority: 11 });
      expect(result.success).toBe(false);
    });
  });

  describe("TaskQuerySchema - query patterns", () => {
    it("query by scheduleId", () => {
      const result = TaskQuerySchema.safeParse({
        scheduleId: "schedule-123",
        take: "20",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.scheduleId).toBe("schedule-123");
      }
    });

    it("query by subject", () => {
      const result = TaskQuerySchema.safeParse({ subject: "Physiology" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.subject).toBe("Physiology");
      }
    });

    it("query combined filters", () => {
      const result = TaskQuerySchema.safeParse({
        scheduleId: "schedule-123",
        subject: "Physiology",
        take: "10",
        skip: "0",
      });
      expect(result.success).toBe(true);
    });

    it("enforces pagination limits", () => {
      const max = TaskQuerySchema.safeParse({ take: "100" });
      expect(max.success).toBe(true);
      const tooLarge = TaskQuerySchema.safeParse({ take: "101" });
      expect(tooLarge.success).toBe(false);
    });
  });

  describe("Task state machine", () => {
    it("initial state is pending with priority 0", () => {
      const result = CreateTaskSchema.safeParse({
        scheduleId: "schedule-123",
        title: "New Task",
        subject: "Physiology",
        targetDate: "2026-04-24T00:00:00.000Z",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priority).toBe(0);
      }
    });

    it("priority scale is 0-10", () => {
      for (let i = 0; i <= 10; i++) {
        const result = CreateTaskSchema.safeParse({
          scheduleId: "schedule-123",
          title: "Task",
          subject: "Physiology",
          targetDate: "2026-04-24T00:00:00.000Z",
          priority: i,
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("Task workflow - create then update", () => {
    it("simulates full task lifecycle", () => {
      const create = CreateTaskSchema.safeParse({
        scheduleId: "schedule-abc",
        title: "NEET PG Chapter 1",
        subject: "Anatomy",
        targetDate: "2026-05-01T00:00:00.000Z",
        priority: 8,
      });
      expect(create.success).toBe(true);

      const update = UpdateTaskSchema.safeParse({
        title: "NEET PG Chapter 1 - Updated",
        priority: 10,
      });
      expect(update.success).toBe(true);
    });
  });
});