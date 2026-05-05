import { describe, it, expect } from "vitest";
import { checkContentLength } from "@/lib/api/http/limits";

const ONE_MIB = 1_048_576;

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

  it("rejects 5MiB against a 1MiB cap", () => {
    expect(checkContentLength("5242880", ONE_MIB).ok).toBe(false);
  });

  it("accepts a body equal to the cap", () => {
    expect(checkContentLength(String(ONE_MIB), ONE_MIB).ok).toBe(true);
  });
});
