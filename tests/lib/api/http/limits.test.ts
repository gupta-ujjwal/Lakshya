import { describe, it, expect } from "vitest";
import { checkContentLength, MAX_IMPORT_BYTES } from "@/lib/api/http/limits";

describe("checkContentLength", () => {
  it("passes when header is missing", () => {
    expect(checkContentLength(null, 100).ok).toBe(true);
  });

  it("passes when header is empty", () => {
    expect(checkContentLength("", 100).ok).toBe(true);
  });

  it("passes when header equals the cap", () => {
    expect(checkContentLength("100", 100).ok).toBe(true);
  });

  it("passes when header is below the cap", () => {
    expect(checkContentLength("99", 100).ok).toBe(true);
  });

  it("rejects when header exceeds the cap", () => {
    const result = checkContentLength("101", 100);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("101");
      expect(result.error).toContain("100");
    }
  });

  it("passes when header is unparseable (let Next enforce its own limit)", () => {
    expect(checkContentLength("not-a-number", 100).ok).toBe(true);
  });

  it("rejects 5MB against the import cap", () => {
    expect(checkContentLength("5242880", MAX_IMPORT_BYTES).ok).toBe(false);
  });

  it("accepts 1MB exactly against the import cap", () => {
    expect(checkContentLength(String(MAX_IMPORT_BYTES), MAX_IMPORT_BYTES).ok).toBe(true);
  });
});
