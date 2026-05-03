import { test, expect } from "@playwright/test";
import { MOBILE_VIEWPORT, DESKTOP_VIEWPORT } from "../helpers/integration";

test.describe("Dashboard Page", () => {
  test.describe.configure({ mode: "serial" });

  let scheduleId: string;
  const testUserId = "e2e-test-user";

  test.beforeAll(async ({ request }) => {
    const response = await request.post("/api/schedules", {
      data: {
        userId: testUserId,
        title: "NEET PG 2026",
        targetDate: new Date(Date.now() + 184 * 24 * 60 * 60 * 1000).toISOString(),
        data: { cycleLength: 7 },
      },
    });
    const body = await response.json();
    scheduleId = body.id;
  });

  test.afterAll(async ({ request }) => {
    if (scheduleId) {
      await request.delete(`/api/schedules/${scheduleId}`);
    }
  });

  test.describe("Desktop viewport", () => {
    test.use({ viewport: DESKTOP_VIEWPORT });

    test.beforeEach(async ({ page }) => {
      await page.goto("/");
      await page.waitForURL((url) => !url.pathname.includes("/import") || url.pathname === "/");
    });

    test("renders page without console errors", async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(msg.text());
      });
      await page.waitForLoadState("networkidle");
      expect(errors).toHaveLength(0);
    });

    test("displays Dashboard header", async ({ page }) => {
      await expect(page.locator("text=Dashboard")).toBeVisible();
    });

    test("displays date in subtitle", async ({ page }) => {
      const today = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      await expect(page.locator(`text=${today}`)).toBeVisible();
    });

    test("displays countdown card with days left", async ({ page }) => {
      await expect(page.locator("text=DAYS LEFT")).toBeVisible();
      const daysNumber = page.locator("text=/^\\d+$/").first();
      await expect(daysNumber).toBeVisible();
    });

    test("displays Today's Progress section", async ({ page }) => {
      await expect(page.locator("text=Today's Progress")).toBeVisible();
      await expect(page.locator("text=%")).toBeVisible();
    });

    test("displays Today's Tasks section", async ({ page }) => {
      await expect(page.locator("text=Today's Tasks")).toBeVisible();
    });

    test("displays Quick Actions section", async ({ page }) => {
      await expect(page.locator("text=Quick Actions")).toBeVisible();
      await expect(page.locator("text=Add Task")).toBeVisible();
      await expect(page.locator("text=Quick Note")).toBeVisible();
      await expect(page.locator("text=Set Reminder")).toBeVisible();
      await expect(page.locator("text=Import Schedule")).toBeVisible();
    });

    test("View all link navigates to tasks page", async ({ page }) => {
      const viewAllLink = page.getByRole("link", { name: "View all" }).first();
      await expect(viewAllLink).toHaveAttribute("href", "/tasks");
    });

    test("Add Task quick action links to tasks page", async ({ page }) => {
      const addTaskLink = page.getByRole("link", { name: "Add Task" }).first();
      await expect(addTaskLink).toHaveAttribute("href", "/tasks?action=add");
    });

    test("Quick Note quick action links to notes page", async ({ page }) => {
      const quickNoteLink = page.getByRole("link", { name: "Quick Note" });
      await expect(quickNoteLink).toHaveAttribute("href", "/notes?action=quick");
    });

    test("Set Reminder quick action links to reminders page", async ({ page }) => {
      const reminderLink = page.getByRole("link", { name: "Set Reminder" });
      await expect(reminderLink).toHaveAttribute("href", "/reminders?action=add");
    });

    test("Import Schedule quick action links to import page", async ({ page }) => {
      const importLink = page.getByRole("link", { name: "Import Schedule" });
      await expect(importLink).toHaveAttribute("href", "/import");
    });

    test("bottom navigation bar is present", async ({ page }) => {
      const nav = page.locator("nav").first();
      await expect(nav).toBeVisible();
      await expect(page.getByRole("link", { name: "Home" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Tasks" })).toBeVisible();
    });
  });

  test.describe("Mobile viewport", () => {
    test.use({ viewport: MOBILE_VIEWPORT });

    test.beforeEach(async ({ page }) => {
      await page.goto("/");
      await page.waitForURL((url) => !url.pathname.includes("/import") || url.pathname === "/");
    });

    test("displays Dashboard header", async ({ page }) => {
      await expect(page.locator("text=Dashboard")).toBeVisible();
    });

    test("quick actions grid remains accessible", async ({ page }) => {
      await expect(page.locator("text=Quick Actions")).toBeVisible();
      await expect(page.locator("text=Add Task")).toBeVisible();
    });

    test("Today's Tasks section is present", async ({ page }) => {
      await expect(page.locator("text=Today's Tasks")).toBeVisible();
    });

    test("bottom navigation bar is present", async ({ page }) => {
      const nav = page.locator("nav").first();
      await expect(nav).toBeVisible();
    });
  });
});

test.describe("Import Page", () => {
  test.describe("Desktop viewport", () => {
    test.use({ viewport: DESKTOP_VIEWPORT });

    test("renders import page", async ({ page }) => {
      await page.goto("/import");
      await expect(page.locator("text=Import Your Study Schedule")).toBeVisible();
    });

    test("displays download schema button", async ({ page }) => {
      await page.goto("/import");
      await expect(page.locator("text=Download Schema")).toBeVisible();
    });

    test("displays download sample button", async ({ page }) => {
      await page.goto("/import");
      await expect(page.locator("text=Download Sample")).toBeVisible();
    });
  });
});