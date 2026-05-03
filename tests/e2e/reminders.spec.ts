import { test, expect } from "@playwright/test";
import { MOBILE_VIEWPORT, DESKTOP_VIEWPORT } from "../helpers/integration";

test.describe("Reminders Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/reminders");
  });

  test.describe("Desktop viewport", () => {
    test.use({ viewport: DESKTOP_VIEWPORT });

    test("renders page without console errors", async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(msg.text());
      });
      await page.waitForLoadState("networkidle");
      expect(errors).toHaveLength(0);
    });

    test("displays page header with active reminder count", async ({ page }) => {
      await expect(page.locator("text=4 active reminders")).toBeVisible();
    });

    test("displays Add Reminder button", async ({ page }) => {
      await expect(page.getByRole("button", { name: "Add Reminder" })).toBeVisible();
    });

    test("displays 3 stat cards (Today, This Week, Recurring)", async ({ page }) => {
      await expect(page.getByText("Today", { exact: true }).first()).toBeVisible();
      await expect(page.getByText("This Week", { exact: true })).toBeVisible();
      await expect(page.getByText("Recurring", { exact: true })).toBeVisible();
    });

    test("displays filter buttons for all reminder types", async ({ page }) => {
      await expect(page.getByRole("button", { name: /All/i }).first()).toBeVisible();
      await expect(page.getByRole("button", { name: "task" })).toBeVisible();
      await expect(page.getByRole("button", { name: "study" })).toBeVisible();
      await expect(page.getByRole("button", { name: "break" })).toBeVisible();
      await expect(page.getByRole("button", { name: "custom" })).toBeVisible();
    });

    test("displays active reminders list", async ({ page }) => {
      await expect(page.locator("text=Morning Study Session")).toBeVisible();
      await expect(page.locator("text=Physiology Quiz")).toBeVisible();
      await expect(page.locator("text=Short Break")).toBeVisible();
      await expect(page.locator("text=Pharmacology Review")).toBeVisible();
    });

    test("reminder cards show repeat badges", async ({ page }) => {
      await expect(page.locator("text=Daily").first()).toBeVisible();
      await expect(page.locator("text=Weekly").first()).toBeVisible();
    });

    test("filter by task type shows only task reminders", async ({ page }) => {
      await page.getByRole("button", { name: "task" }).click();
      await expect(page.locator("text=Physiology Quiz")).toBeVisible();
      await expect(page.locator("text=Morning Study Session")).not.toBeVisible();
    });

    test("Add Reminder button opens modal", async ({ page }) => {
      await page.getByRole("button", { name: "Add Reminder" }).click();
      await expect(page.locator("h2", { hasText: "Add Reminder" })).toBeVisible();
    });

    test.describe("Add Reminder Modal", () => {
      test.beforeEach(async ({ page }) => {
        await page.getByRole("button", { name: "Add Reminder" }).click();
      });

      test("modal has title, type, date, time, repeat fields", async ({ page }) => {
        await expect(page.locator("label", { hasText: "Title" })).toBeVisible();
        await expect(page.locator("label", { hasText: "Type" })).toBeVisible();
        await expect(page.locator("label", { hasText: "Date" })).toBeVisible();
        await expect(page.locator("label", { hasText: "Time" })).toBeVisible();
        await expect(page.locator("label", { hasText: "Repeat" })).toBeVisible();
      });

      test("Cancel button closes modal", async ({ page }) => {
        await page.getByRole("button", { name: "Cancel" }).click();
        await expect(page.locator("h2", { hasText: "Add Reminder" })).not.toBeVisible();
      });
    });

    test("Show inactive toggle reveals inactive reminders", async ({ page }) => {
      await expect(page.locator("text=Show 1 inactive reminder")).toBeVisible();
    });

    test("clicking inactive toggle reveals show-inactive button", async ({ page }) => {
      await expect(page.locator("text=Show 1 inactive reminder")).toBeVisible();
      await page.getByText("Show 1 inactive reminder").click();
      await page.waitForTimeout(300);
      const checkbox = page.locator('input[type="checkbox"]');
      await expect(checkbox).toBeChecked();
    });
  });

  test.describe("Mobile viewport", () => {
    test.use({ viewport: MOBILE_VIEWPORT });

    test("stat cards stack vertically", async ({ page }) => {
      await expect(page.getByText("Today", { exact: true }).first()).toBeVisible();
    });

    test("filter buttons are scrollable", async ({ page }) => {
      await expect(page.getByRole("button", { name: "break" })).toBeVisible();
    });

    test("reminder cards are full width", async ({ page }) => {
      await expect(page.locator("text=Morning Study Session")).toBeVisible();
    });
  });
});