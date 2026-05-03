import { describe, it, expect } from "vitest";
import {
  CreateTaskSchema,
  UpdateTaskSchema,
  TaskQuerySchema,
} from "@/lib/api/tasks/schemas";

describe("Tasks API Schemas", () => {
  describe("CreateTaskSchema", () => {
    it("accepts valid task with all required fields", () => {
      const result = CreateTaskSchema.safeParse({
        scheduleId: "schedule-123",
        title: "Read Anatomy Chapter 1",
        subject: "Anatomy",
        targetDate: "2026-04-15T00:00:00.000Z",
      });
      expect(result.success).toBe(true);
    });

    it("accepts task with optional priority", () => {
      const result = CreateTaskSchema.safeParse({
        scheduleId: "schedule-123",
        title: "Read Anatomy Chapter 1",
        subject: "Anatomy",
        targetDate: "2026-04-15T00:00:00.000Z",
        priority: 8,
      });
      expect(result.success).toBe(true);
    });

    it("defaults priority to 0 when not provided", () => {
      const result = CreateTaskSchema.safeParse({
        scheduleId: "schedule-123",
        title: "Read Anatomy Chapter 1",
        subject: "Anatomy",
        targetDate: "2026-04-15T00:00:00.000Z",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priority).toBe(0);
      }
    });

    it("accepts Date object as targetDate", () => {
      const result = CreateTaskSchema.safeParse({
        scheduleId: "schedule-123",
        title: "Read Anatomy Chapter 1",
        subject: "Anatomy",
        targetDate: new Date("2026-04-15"),
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing scheduleId", () => {
      const result = CreateTaskSchema.safeParse({
        title: "Read Anatomy Chapter 1",
        subject: "Anatomy",
        targetDate: "2026-04-15T00:00:00.000Z",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing title", () => {
      const result = CreateTaskSchema.safeParse({
        scheduleId: "schedule-123",
        subject: "Anatomy",
        targetDate: "2026-04-15T00:00:00.000Z",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing subject", () => {
      const result = CreateTaskSchema.safeParse({
        scheduleId: "schedule-123",
        title: "Read Anatomy Chapter 1",
        targetDate: "2026-04-15T00:00:00.000Z",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty scheduleId", () => {
      const result = CreateTaskSchema.safeParse({
        scheduleId: "",
        title: "Read Anatomy Chapter 1",
        subject: "Anatomy",
        targetDate: "2026-04-15T00:00:00.000Z",
      });
      expect(result.success).toBe(false);
    });

    it("rejects priority below minimum (0)", () => {
      const result = CreateTaskSchema.safeParse({
        scheduleId: "schedule-123",
        title: "Read Anatomy Chapter 1",
        subject: "Anatomy",
        targetDate: "2026-04-15T00:00:00.000Z",
        priority: -1,
      });
      expect(result.success).toBe(false);
    });

    it("rejects priority above maximum (10)", () => {
      const result = CreateTaskSchema.safeParse({
        scheduleId: "schedule-123",
        title: "Read Anatomy Chapter 1",
        subject: "Anatomy",
        targetDate: "2026-04-15T00:00:00.000Z",
        priority: 11,
      });
      expect(result.success).toBe(false);
    });

    it("rejects subject exceeding max length (100)", () => {
      const result = CreateTaskSchema.safeParse({
        scheduleId: "schedule-123",
        title: "Read",
        subject: "a".repeat(101),
        targetDate: "2026-04-15T00:00:00.000Z",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid date format", () => {
      const result = CreateTaskSchema.safeParse({
        scheduleId: "schedule-123",
        title: "Read Anatomy Chapter 1",
        subject: "Anatomy",
        targetDate: "2026-04-15",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("UpdateTaskSchema", () => {
    it("accepts partial update with title only", () => {
      const result = UpdateTaskSchema.safeParse({
        title: "Updated Title",
      });
      expect(result.success).toBe(true);
    });

    it("accepts partial update with priority only", () => {
      const result = UpdateTaskSchema.safeParse({
        priority: 9,
      });
      expect(result.success).toBe(true);
    });

    it("accepts empty update", () => {
      const result = UpdateTaskSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("rejects invalid priority", () => {
      const result = UpdateTaskSchema.safeParse({
        priority: 15,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("TaskQuerySchema", () => {
    it("accepts empty query", () => {
      const result = TaskQuerySchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("accepts scheduleId filter", () => {
      const result = TaskQuerySchema.safeParse({ scheduleId: "schedule-123" });
      expect(result.success).toBe(true);
    });

    it("accepts subject filter", () => {
      const result = TaskQuerySchema.safeParse({ subject: "Anatomy" });
      expect(result.success).toBe(true);
    });

    it("accepts combined filters", () => {
      const result = TaskQuerySchema.safeParse({
        scheduleId: "schedule-123",
        subject: "Anatomy",
        take: "20",
        skip: "0",
      });
      expect(result.success).toBe(true);
    });

    it("rejects take above maximum", () => {
      const result = TaskQuerySchema.safeParse({ take: "101" });
      expect(result.success).toBe(false);
    });
  });
});