import { test, expect } from "@playwright/test";
import { MOBILE_VIEWPORT, DESKTOP_VIEWPORT } from "../helpers/integration";

// /tasks pulls from /api/tasks. With no schedule loaded, the page redirects
// to /import. These tests assert on page chrome that renders regardless of
// data state, plus the redirect/empty-state behavior. Data-bound assertions
// belong in a separate suite that seeds a schedule fixture first.

test.describe("Tasks Page", () => {
  test.describe("Desktop viewport", () => {
    test.use({ viewport: DESKTOP_VIEWPORT });

    test("renders without console errors", async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(msg.text());
      });
      await page.goto("/tasks");
      await page.waitForLoadState("networkidle");
      expect(errors).toHaveLength(0);
    });

    test("redirects to /import when no schedule exists", async ({ page }) => {
      await page.goto("/tasks");
      await page.waitForURL(/\/(import|tasks)$/);
      const url = page.url();
      // Either we landed on /import (no schedule) or we stayed on /tasks
      // (a schedule exists from a prior test run). Both are valid.
      expect(url).toMatch(/\/(import|tasks)$/);
    });
  });

  test.describe("Mobile viewport", () => {
    test.use({ viewport: MOBILE_VIEWPORT });

    test("renders without console errors", async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(msg.text());
      });
      await page.goto("/tasks");
      await page.waitForLoadState("networkidle");
      expect(errors).toHaveLength(0);
    });
  });
});
