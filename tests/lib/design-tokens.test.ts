import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

function readGlobals(): string {
  return readFileSync(join(process.cwd(), "src/globals.css"), "utf-8");
}

// WCAG relative-luminance and contrast helpers. Kept inline so the test
// suite doesn't pull in a colour-math dep just to assert two ratios.
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace(/^#/, "");
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}
function srgbToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return (
    0.2126 * srgbToLinear(r) +
    0.7152 * srgbToLinear(g) +
    0.0722 * srgbToLinear(b)
  );
}
function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [lighter, darker] = la >= lb ? [la, lb] : [lb, la];
  return (lighter + 0.05) / (darker + 0.05);
}

// Slice CSS at the :root and .dark blocks so token reads can't cross
// the boundary. Each block redeclares the same names with different
// values; a naïve regex over the whole file picks an arbitrary one.
function blockBody(css: string, selector: string): string {
  const re = new RegExp(`${selector}\\s*\\{([\\s\\S]*?)\\}`);
  const m = css.match(re);
  if (!m) throw new Error(`Block ${selector} not found in globals.css`);
  return m[1];
}
function readHex(blockCss: string, varName: string): string {
  const m = blockCss.match(new RegExp(`${varName}:\\s*(#[0-9A-Fa-f]{6})`));
  if (!m) throw new Error(`Var ${varName} not found in block`);
  return m[1];
}

describe("Design Token Compliance", () => {
  describe("Border Radius Tokens", () => {
    it("matches spec: --radius-sm should be 0.5rem (8px)", () => {
      const css = readGlobals();
      const smMatch = css.match(/--radius-sm:\s*([\d.]+)rem/);
      expect(smMatch).not.toBeNull();
      const smValue = parseFloat(smMatch![1]);
      expect(smValue).toBe(0.5);
    });

    it("matches spec: --radius-md should be 0.75rem (12px)", () => {
      const css = readGlobals();
      const mdMatch = css.match(/--radius-md:\s*([\d.]+)rem/);
      expect(mdMatch).not.toBeNull();
      const mdValue = parseFloat(mdMatch![1]);
      expect(mdValue).toBe(0.75);
    });

    it("matches spec: --radius-lg should be 1rem (16px)", () => {
      const css = readGlobals();
      const lgMatch = css.match(/--radius-lg:\s*([\d.]+)rem/);
      expect(lgMatch).not.toBeNull();
      const lgValue = parseFloat(lgMatch![1]);
      expect(lgValue).toBe(1);
    });
  });

  describe("Accent contrast (WCAG AA, 4.5:1)", () => {
    // Two directions matter: text on bg (--accent-strong on --bg-primary)
    // and bg on text (a button's --accent-strong-fg on --accent-strong).
    // No single hex can clear AA in both directions across both themes,
    // which is why --accent-strong-fg exists.

    it("light-mode --accent-strong meets 4.5:1 against --bg-primary (text direction)", () => {
      const block = blockBody(readGlobals(), ":root");
      const accent = readHex(block, "--accent-strong");
      const bg = readHex(block, "--bg-primary");
      expect(contrast(accent, bg)).toBeGreaterThanOrEqual(4.5);
    });

    it("dark-mode --accent-strong meets 4.5:1 against --bg-primary (text direction)", () => {
      const block = blockBody(readGlobals(), "\\.dark");
      const accent = readHex(block, "--accent-strong");
      const bg = readHex(block, "--bg-primary");
      expect(contrast(accent, bg)).toBeGreaterThanOrEqual(4.5);
    });

    it("light-mode --accent-strong-fg on --accent-strong meets 4.5:1 (button direction)", () => {
      const block = blockBody(readGlobals(), ":root");
      const fg = readHex(block, "--accent-strong-fg");
      const bg = readHex(block, "--accent-strong");
      expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
    });

    it("dark-mode --accent-strong-fg on --accent-strong meets 4.5:1 (button direction)", () => {
      const block = blockBody(readGlobals(), "\\.dark");
      const fg = readHex(block, "--accent-strong-fg");
      const bg = readHex(block, "--accent-strong");
      expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
    });
  });
});
