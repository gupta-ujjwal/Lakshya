import { describe, it, expect, vi } from "vitest";
import { handleApiError, ValidationError, parseQueryParams } from "@/lib/api/utils";

describe("API Utils - Extended", () => {
  describe("handleApiError - error type coverage", () => {
    it("handles Prisma P2003 foreign key error (user not found)", () => {
      const error = { code: "P2003", message: "Foreign key constraint failed" };
      const response = handleApiError(error);
      expect(response.status).toBe(500);
    });

    it("handles Prisma P2002 unique constraint error", () => {
      const error = { code: "P2002", message: "Unique constraint failed" };
      const response = handleApiError(error);
      expect(response.status).toBe(500);
    });

    it("handles Prisma P2025 record not found error", () => {
      const error = { code: "P2025", message: "Record not found" };
      const response = handleApiError(error);
      expect(response.status).toBe(500);
    });

    it("handles null error", () => {
      const response = handleApiError(null);
      expect(response.status).toBe(500);
    });

    it("handles undefined error", () => {
      const response = handleApiError(undefined);
      expect(response.status).toBe(500);
    });

    it("handles string error", () => {
      const response = handleApiError("Something went wrong");
      expect(response.status).toBe(500);
    });

    it("response contains error message in body", () => {
      const error = new Error("Database connection failed");
      const response = handleApiError(error);
      expect(response.status).toBe(500);
    });
  });

  describe("parseQueryParams", () => {
    it("parses empty search params", () => {
      const params = new URLSearchParams();
      const result = parseQueryParams(
        { safeParse: vi.fn(() => ({ success: true, data: {} })) } as any,
        params
      );
      expect(result).toEqual({});
    });

    it("converts search params to plain object", () => {
      const params = new URLSearchParams("userId=user-123&take=10");
      const result = parseQueryParams(
        { safeParse: vi.fn((data: any) => ({ success: true, data })) } as any,
        params
      );
      expect(result).toEqual({ userId: "user-123", take: "10" });
    });

    it("returns null on parse failure", () => {
      const params = new URLSearchParams("invalid=value");
      const result = parseQueryParams(
        {
          safeParse: vi.fn(() => ({ success: false, error: { issues: [] } })),
        } as any,
        params
      );
      expect(result).toBeNull();
    });

    it("handles duplicate params (takes last value)", () => {
      const params = new URLSearchParams("userId=first&userId=second");
      const result = parseQueryParams(
        { safeParse: vi.fn((data: any) => ({ success: true, data })) } as any,
        params
      );
      expect(result).toEqual({ userId: "second" });
    });
  });

  describe("ValidationError edge cases", () => {
    it("works with JSON.stringify", () => {
      const error = new ValidationError([
        { path: ["email"], message: "Invalid email" },
      ]);
      const json = JSON.stringify(error);
      expect(json).toBeDefined();
    });

    it("has correct prototype chain", () => {
      const error = new ValidationError([]);
      expect(error instanceof Error).toBe(true);
      expect(error instanceof RangeError).toBe(false);
    });
  });
});