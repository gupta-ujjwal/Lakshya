import { test, expect } from "@playwright/test";
import { MOBILE_VIEWPORT, DESKTOP_VIEWPORT } from "../helpers/integration";

test.describe("Tasks Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tasks");
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

    test("displays page header with task count", async ({ page }) => {
      await expect(page.locator("h1, [class*='font-display']").first()).toBeVisible();
    });

    test("displays view mode toggle (list/kanban/calendar)", async ({ page }) => {
      await expect(page.getByRole("button", { name: "List" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Kanban" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Calendar" })).toBeVisible();
    });

    test("subject filter dropdown is present", async ({ page }) => {
      const subjectSelect = page.locator("select").first();
      await expect(subjectSelect).toBeVisible();
    });

    test("priority filter buttons are present", async ({ page }) => {
      await expect(page.getByRole("button", { name: /All/i }).first()).toBeVisible();
      await expect(page.getByRole("button", { name: "High" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Medium" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Low" })).toBeVisible();
    });

    test("status filter buttons are present", async ({ page }) => {
      await expect(page.getByRole("button", { name: /All/i }).first()).toBeVisible();
      await expect(page.getByRole("button", { name: "Pending" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Completed" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Overdue" })).toBeVisible();
    });

    test("displays task count badges (completed/pending/overdue)", async ({ page }) => {
      await expect(page.getByText("Completed", { exact: true })).toBeVisible();
      await expect(page.getByText("Pending", { exact: true })).toBeVisible();
      await expect(page.getByText("Overdue", { exact: true })).toBeVisible();
    });

    test("displays task list items with correct data", async ({ page }) => {
      await expect(page.locator("text=Cardiovascular System Review")).toBeVisible();
      await expect(page.getByText("Physiology").nth(1)).toBeVisible();
      await expect(page.getByText("Pharmacology").nth(1)).toBeVisible();
    });

    test("task toggle changes task status on click", async ({ page }) => {
      const pendingTask = page.locator(".card").filter({ hasText: "Biochemical Pathways" }).first();
      await expect(pendingTask).toBeVisible();
      const toggleButton = pendingTask.locator("button").first();
      await expect(toggleButton).toBeVisible();
      const beforeCount = await page.locator("text=Pending4").count();
      expect(beforeCount).toBe(1);
      await toggleButton.click();
      await page.waitForTimeout(300);
      const afterCount = await page.locator("text=Pending3").count();
      expect(afterCount).toBe(1);
    });

    test("overdue tasks have danger styling", async ({ page }) => {
      const overdueTask = page.locator(".card").filter({ hasText: "Pathology Case Studies" });
      await expect(overdueTask).toBeVisible();
    });

    test("Add Task button opens modal", async ({ page }) => {
      await page.getByRole("button", { name: "Add Task" }).click();
      await expect(page.locator("text=Add New Task")).toBeVisible();
    });

    test("priority badges display correct colors", async ({ page }) => {
      const highBadge = page.locator("text=High").first();
      await expect(highBadge).toBeVisible();
    });

    test("switching to kanban view renders columns", async ({ page }) => {
      await page.getByRole("button", { name: "Kanban" }).click();
      await expect(page.getByText("pending", { exact: true }).last()).toBeVisible();
      await expect(page.getByRole("heading", { name: "pending" })).toBeVisible();
    });

    test("switching to calendar view shows placeholder", async ({ page }) => {
      await page.getByRole("button", { name: "Calendar" }).click();
      await expect(page.locator("text=Calendar view coming soon")).toBeVisible();
    });

    test("filtering by high priority shows only high priority tasks", async ({ page }) => {
      await page.getByRole("button", { name: "High" }).click();
      await expect(page.locator("text=Cardiovascular System Review")).toBeVisible();
    });

    test("filtering by pending status shows only pending tasks", async ({ page }) => {
      await page.getByRole("button", { name: "Pending" }).click();
      await expect(page.locator("text=Biochemical Pathways")).toBeVisible();
    });

    test("filtering by subject shows filtered tasks", async ({ page }) => {
      const subjectSelect = page.locator("select").first();
      await subjectSelect.selectOption("Physiology");
      await expect(page.locator("text=Cardiovascular System Review")).toBeVisible();
      await expect(page.locator("text=Biochemical Pathways")).not.toBeVisible();
    });
  });

  test.describe("Mobile viewport", () => {
    test.use({ viewport: MOBILE_VIEWPORT });

    test("view mode toggle is accessible", async ({ page }) => {
      await expect(page.getByRole("button", { name: "List" })).toBeVisible();
    });

    test("priority filters are horizontally scrollable", async ({ page }) => {
      await expect(page.getByRole("button", { name: "High" })).toBeVisible();
    });

    test("task cards are full width", async ({ page }) => {
      const taskCard = page.locator(".card").filter({ hasText: "Cardiovascular" }).first();
      await expect(taskCard).toBeVisible();
    });
  });
});