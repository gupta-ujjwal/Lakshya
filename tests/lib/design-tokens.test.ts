import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("Design Token Compliance", () => {
  describe("Border Radius Tokens", () => {
    it("matches spec: --radius-sm should be 0.5rem (8px)", () => {
      const css = readFileSync(
        join(process.cwd(), "src/globals.css"),
        "utf-8"
      );
      const smMatch = css.match(/--radius-sm:\s*([\d.]+)rem/);
      expect(smMatch).not.toBeNull();
      const smValue = parseFloat(smMatch![1]);
      expect(smValue).toBe(0.5);
    });

    it("matches spec: --radius-md should be 0.75rem (12px)", () => {
      const css = readFileSync(
        join(process.cwd(), "src/globals.css"),
        "utf-8"
      );
      const mdMatch = css.match(/--radius-md:\s*([\d.]+)rem/);
      expect(mdMatch).not.toBeNull();
      const mdValue = parseFloat(mdMatch![1]);
      expect(mdValue).toBe(0.75);
    });

    it("matches spec: --radius-lg should be 1rem (16px)", () => {
      const css = readFileSync(
        join(process.cwd(), "src/globals.css"),
        "utf-8"
      );
      const lgMatch = css.match(/--radius-lg:\s*([\d.]+)rem/);
      expect(lgMatch).not.toBeNull();
      const lgValue = parseFloat(lgMatch![1]);
      expect(lgValue).toBe(1);
    });
  });
});