import { describe, it, expect } from "vitest";
import {
  SessionReflectionSchema,
  StartSessionSchema,
  EndSessionSchema,
} from "@/lib/api/sessions/schemas";

describe("SessionReflectionSchema", () => {
  it("accepts the three supported emojis", () => {
    for (const emoji of ["💪", "🙂", "😩"] as const) {
      expect(SessionReflectionSchema.safeParse(emoji).success).toBe(true);
    }
  });

  it("rejects arbitrary strings or other emojis", () => {
    for (const value of ["", "happy", "😀", "🎉"]) {
      expect(SessionReflectionSchema.safeParse(value).success).toBe(false);
    }
  });
});

describe("StartSessionSchema", () => {
  it("accepts an empty body (auto-pick + default focus)", () => {
    expect(StartSessionSchema.safeParse({}).success).toBe(true);
  });

  it("accepts a taskId override", () => {
    const result = StartSessionSchema.safeParse({ taskId: "task-123" });
    expect(result.success).toBe(true);
  });

  it("accepts a custom focus length within bounds", () => {
    expect(StartSessionSchema.safeParse({ focusMinutes: 50 }).success).toBe(true);
  });

  it("rejects empty taskId", () => {
    expect(StartSessionSchema.safeParse({ taskId: "" }).success).toBe(false);
  });

  it("rejects non-integer focus length", () => {
    expect(StartSessionSchema.safeParse({ focusMinutes: 25.5 }).success).toBe(false);
  });

  it("rejects out-of-range focus length", () => {
    expect(StartSessionSchema.safeParse({ focusMinutes: 0 }).success).toBe(false);
    expect(StartSessionSchema.safeParse({ focusMinutes: 181 }).success).toBe(false);
  });
});

describe("EndSessionSchema", () => {
  it("accepts an empty body (skipped reflection, no completion)", () => {
    expect(EndSessionSchema.safeParse({}).success).toBe(true);
  });

  it("accepts reflection and markTaskComplete together", () => {
    const result = EndSessionSchema.safeParse({
      reflection: "💪",
      markTaskComplete: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects unsupported reflection emoji", () => {
    const result = EndSessionSchema.safeParse({ reflection: "🤷" });
    expect(result.success).toBe(false);
  });

  it("rejects non-boolean markTaskComplete", () => {
    const result = EndSessionSchema.safeParse({ markTaskComplete: "yes" });
    expect(result.success).toBe(false);
  });
});
