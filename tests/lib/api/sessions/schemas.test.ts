import { describe, it, expect } from "vitest";
import {
  CreateSessionSchema,
  UpdateSessionSchema,
  SessionQuerySchema,
} from "@/lib/api/sessions/schemas";

describe("Sessions API Schemas", () => {
  describe("CreateSessionSchema", () => {
    it("accepts valid session with all required fields", () => {
      const result = CreateSessionSchema.safeParse({
        userId: "user-123",
        startedAt: "2026-04-24T10:00:00.000Z",
      });
      expect(result.success).toBe(true);
    });

    it("accepts session with optional endedAt", () => {
      const result = CreateSessionSchema.safeParse({
        userId: "user-123",
        startedAt: "2026-04-24T10:00:00.000Z",
        endedAt: "2026-04-24T12:30:00.000Z",
      });
      expect(result.success).toBe(true);
    });

    it("accepts session with optional duration", () => {
      const result = CreateSessionSchema.safeParse({
        userId: "user-123",
        startedAt: "2026-04-24T10:00:00.000Z",
        duration: 9000,
      });
      expect(result.success).toBe(true);
    });

    it("accepts Date object as startedAt", () => {
      const result = CreateSessionSchema.safeParse({
        userId: "user-123",
        startedAt: new Date("2026-04-24T10:00:00.000Z"),
      });
      expect(result.success).toBe(true);
    });

    it("accepts Date object as endedAt", () => {
      const result = CreateSessionSchema.safeParse({
        userId: "user-123",
        startedAt: "2026-04-24T10:00:00.000Z",
        endedAt: new Date("2026-04-24T12:30:00.000Z"),
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing userId", () => {
      const result = CreateSessionSchema.safeParse({
        startedAt: "2026-04-24T10:00:00.000Z",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing startedAt", () => {
      const result = CreateSessionSchema.safeParse({
        userId: "user-123",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty string userId", () => {
      const result = CreateSessionSchema.safeParse({
        userId: "",
        startedAt: "2026-04-24T10:00:00.000Z",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid datetime format for startedAt", () => {
      const result = CreateSessionSchema.safeParse({
        userId: "user-123",
        startedAt: "2026-04-24",
      });
      expect(result.success).toBe(false);
    });

    it("rejects negative duration", () => {
      const result = CreateSessionSchema.safeParse({
        userId: "user-123",
        startedAt: "2026-04-24T10:00:00.000Z",
        duration: -1,
      });
      expect(result.success).toBe(false);
    });

    it("rejects non-integer duration", () => {
      const result = CreateSessionSchema.safeParse({
        userId: "user-123",
        startedAt: "2026-04-24T10:00:00.000Z",
        duration: 1.5,
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid datetime format for endedAt", () => {
      const result = CreateSessionSchema.safeParse({
        userId: "user-123",
        startedAt: "2026-04-24T10:00:00.000Z",
        endedAt: "not-a-date",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("UpdateSessionSchema", () => {
    it("accepts partial update with endedAt only", () => {
      const result = UpdateSessionSchema.safeParse({
        endedAt: "2026-04-24T12:30:00.000Z",
      });
      expect(result.success).toBe(true);
    });

    it("accepts partial update with duration only", () => {
      const result = UpdateSessionSchema.safeParse({
        duration: 9000,
      });
      expect(result.success).toBe(true);
    });

    it("accepts empty update", () => {
      const result = UpdateSessionSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("accepts Date object as endedAt", () => {
      const result = UpdateSessionSchema.safeParse({
        endedAt: new Date("2026-04-24T12:30:00.000Z"),
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid datetime for endedAt", () => {
      const result = UpdateSessionSchema.safeParse({
        endedAt: "invalid",
      });
      expect(result.success).toBe(false);
    });

    it("rejects negative duration", () => {
      const result = UpdateSessionSchema.safeParse({
        duration: -100,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("SessionQuerySchema", () => {
    it("accepts empty query", () => {
      const result = SessionQuerySchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("accepts userId filter", () => {
      const result = SessionQuerySchema.safeParse({ userId: "user-123" });
      expect(result.success).toBe(true);
    });

    it("accepts startedAt filter", () => {
      const result = SessionQuerySchema.safeParse({
        startedAt: "2026-04-01T00:00:00.000Z",
      });
      expect(result.success).toBe(true);
    });

    it("accepts pagination parameters", () => {
      const result = SessionQuerySchema.safeParse({ take: "20", skip: "10" });
      expect(result.success).toBe(true);
    });

    it("coerces string numbers", () => {
      const result = SessionQuerySchema.safeParse({ take: "50", skip: "5" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.take).toBe(50);
        expect(result.data.skip).toBe(5);
      }
    });

    it("rejects take above maximum", () => {
      const result = SessionQuerySchema.safeParse({ take: "101" });
      expect(result.success).toBe(false);
    });

    it("rejects take below minimum", () => {
      const result = SessionQuerySchema.safeParse({ take: "0" });
      expect(result.success).toBe(false);
    });

    it("accepts combined filters", () => {
      const result = SessionQuerySchema.safeParse({
        userId: "user-123",
        startedAt: "2026-04-01T00:00:00.000Z",
        take: "20",
        skip: "0",
      });
      expect(result.success).toBe(true);
    });
  });
});