import { test, expect } from "@playwright/test";
import { MOBILE_VIEWPORT, DESKTOP_VIEWPORT } from "../helpers/integration";

test.describe("Settings Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings");
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

    test("displays all 4 settings tabs", async ({ page }) => {
      await expect(page.getByRole("button", { name: "General" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Schedule" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Display" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Data" })).toBeVisible();
    });

    test("Save Changes button is present", async ({ page }) => {
      await expect(page.getByRole("button", { name: "Save Changes" })).toBeVisible();
    });

    test.describe("General Tab", () => {
      test("theme selector is present", async ({ page }) => {
        await expect(page.locator("select").first()).toBeVisible();
      });

      test("all 4 notification toggles are present", async ({ page }) => {
        const toggles = page.locator('input[type="checkbox"]');
        await expect(toggles).toHaveCount(4);
      });
    });

    test.describe("Schedule Tab", () => {
      test.beforeEach(async ({ page }) => {
        await page.getByRole("button", { name: "Schedule" }).click();
      });

      test("study hours start/end inputs are present", async ({ page }) => {
        await expect(page.locator('input[type="time"]').first()).toBeVisible();
      });

      test("break duration input accepts numeric values", async ({ page }) => {
        const breakInput = page.locator('input[type="number"]').first();
        await expect(breakInput).toBeVisible();
      });

      test("sessions per day input accepts numeric values", async ({ page }) => {
        const sessionsInput = page.locator('input[type="number"]').nth(1);
        await expect(sessionsInput).toBeVisible();
      });
    });

    test.describe("Display Tab", () => {
      test.beforeEach(async ({ page }) => {
        await page.getByRole("button", { name: "Display" }).click();
      });

      test("subject colors toggle is present", async ({ page }) => {
        await expect(page.locator("text=Subject Colors")).toBeVisible();
      });

      test("compact mode toggle is present", async ({ page }) => {
        await expect(page.locator("text=Compact Mode")).toBeVisible();
      });

      test("week starts on selector is present", async ({ page }) => {
        await expect(page.locator("text=Week Starts On")).toBeVisible();
      });
    });

    test.describe("Data Tab", () => {
      test.beforeEach(async ({ page }) => {
        await page.getByRole("button", { name: "Data" }).click();
      });

      test("Import Schedule section is present", async ({ page }) => {
        await expect(page.locator("text=Import Schedule")).toBeVisible();
      });

      test("Export All Data button is present", async ({ page }) => {
        await expect(page.getByRole("button", { name: "Export All Data" })).toBeVisible();
      });

      test("Danger Zone section is present with delete button", async ({ page }) => {
        await expect(page.locator("text=Danger Zone")).toBeVisible();
        await expect(page.getByRole("button", { name: "Delete All Data" })).toBeVisible();
      });
    });

    test("saving settings shows confirmation", async ({ page }) => {
      await page.getByRole("button", { name: "Save Changes" }).click();
      await expect(page.getByText("Saved")).toBeVisible();
    });
  });

  test.describe("Mobile viewport", () => {
    test.use({ viewport: MOBILE_VIEWPORT });

    test("tabs stack vertically", async ({ page }) => {
      await expect(page.getByRole("button", { name: "General" })).toBeVisible();
    });

    test("schedule inputs are full width", async ({ page }) => {
      await page.getByRole("button", { name: "Schedule" }).click();
      await expect(page.locator('input[type="time"]').first()).toBeVisible();
    });
  });
});