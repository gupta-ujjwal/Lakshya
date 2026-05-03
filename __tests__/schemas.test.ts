import { describe, it, expect } from "vitest";
import {
  CreateUserSchema,
  UpdateUserSchema,
  UserQuerySchema,
} from "../lib/api/users/schemas";

describe("User Schemas", () => {
  describe("CreateUserSchema", () => {
    it("validates empty object", () => {
      const result = CreateUserSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("validates with email and name", () => {
      const result = CreateUserSchema.safeParse({
        email: "test@example.com",
        name: "Test User",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("test@example.com");
        expect(result.data.name).toBe("Test User");
      }
    });

    it("rejects invalid email", () => {
      const result = CreateUserSchema.safeParse({ email: "not-an-email" });
      expect(result.success).toBe(false);
    });

    it("rejects empty name", () => {
      const result = CreateUserSchema.safeParse({ name: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("UpdateUserSchema", () => {
    it("validates partial updates", () => {
      const result = UpdateUserSchema.safeParse({ name: "Updated Name" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Updated Name");
        expect(result.data.email).toBeUndefined();
      }
    });

    it("rejects invalid email", () => {
      const result = UpdateUserSchema.safeParse({ email: "invalid" });
      expect(result.success).toBe(false);
    });
  });

  describe("UserQuerySchema", () => {
    it("parses take and skip", () => {
      new URLSearchParams("take=10&skip=5");
      const result = UserQuerySchema.safeParse({
        take: "10",
        skip: "5",
      });
      expect(result.success).toBe(true);
    });

    it("limits take to max 100", () => {
      const result = UserQuerySchema.safeParse({ take: "200" });
      expect(result.success).toBe(false);
    });
  });
});