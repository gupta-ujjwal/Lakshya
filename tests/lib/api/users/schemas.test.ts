import { describe, it, expect } from "vitest";
import {
  CreateUserSchema,
  UpdateUserSchema,
  UserQuerySchema,
} from "@/lib/api/users/schemas";

describe("Users API Schemas", () => {
  describe("CreateUserSchema", () => {
    it("accepts valid user with email and name", () => {
      const result = CreateUserSchema.safeParse({
        email: "test@example.com",
        name: "Test User",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          email: "test@example.com",
          name: "Test User",
        });
      }
    });

    it("accepts user with only email", () => {
      const result = CreateUserSchema.safeParse({
        email: "test@example.com",
      });
      expect(result.success).toBe(true);
    });

    it("accepts user with only name", () => {
      const result = CreateUserSchema.safeParse({
        name: "Test User",
      });
      expect(result.success).toBe(true);
    });

    it("accepts empty object (all fields optional)", () => {
      const result = CreateUserSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("rejects invalid email format", () => {
      const result = CreateUserSchema.safeParse({
        email: "not-an-email",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("email");
      }
    });

    it("rejects empty string name", () => {
      const result = CreateUserSchema.safeParse({
        name: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("UpdateUserSchema", () => {
    it("accepts partial update with email only", () => {
      const result = UpdateUserSchema.safeParse({ email: "new@example.com" });
      expect(result.success).toBe(true);
    });

    it("accepts partial update with name only", () => {
      const result = UpdateUserSchema.safeParse({ name: "New Name" });
      expect(result.success).toBe(true);
    });

    it("accepts empty update (all fields optional)", () => {
      const result = UpdateUserSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("rejects invalid email format", () => {
      const result = UpdateUserSchema.safeParse({
        email: "invalid-email",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("UserQuerySchema", () => {
    it("accepts empty query", () => {
      const result = UserQuerySchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("accepts valid email filter", () => {
      const result = UserQuerySchema.safeParse({ email: "test@example.com" });
      expect(result.success).toBe(true);
    });

    it("accepts valid take parameter", () => {
      const result = UserQuerySchema.safeParse({ take: "10" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.take).toBe(10);
      }
    });

    it("accepts valid skip parameter", () => {
      const result = UserQuerySchema.safeParse({ skip: "5" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.skip).toBe(5);
      }
    });

    it("rejects take above maximum (100)", () => {
      const result = UserQuerySchema.safeParse({ take: "101" });
      expect(result.success).toBe(false);
    });

    it("rejects invalid email in query", () => {
      const result = UserQuerySchema.safeParse({ email: "not-email" });
      expect(result.success).toBe(false);
    });

    it("coerces numeric strings", () => {
      const result = UserQuerySchema.safeParse({ take: "50", skip: "10" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.take).toBe("number");
        expect(typeof result.data.skip).toBe("number");
      }
    });
  });
});