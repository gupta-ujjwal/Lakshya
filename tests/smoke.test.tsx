import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { App } from "@/App";
import { clearDb } from "./helpers";

// Smoke test: mount the full App router + theme provider and assert no
// render error escapes. Catches things `pnpm build` can't (a bad import
// path that's only exercised at runtime, a missing context provider, an
// IndexedDB call from a hook on first render).
describe("App smoke test", () => {
  beforeEach(async () => {
    await clearDb();
  });
  afterEach(() => {
    cleanup();
  });

  it("renders without throwing", () => {
    expect(() => render(<App />)).not.toThrow();
  });
});
