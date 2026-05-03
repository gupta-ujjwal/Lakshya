import { test, expect } from "@playwright/test";
import { MOBILE_VIEWPORT, DESKTOP_VIEWPORT } from "../helpers/integration";

test.describe("Notes Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/notes");
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

    test("displays page header with note count", async ({ page }) => {
      await expect(page.locator("text=6 notes")).toBeVisible();
    });

    test("displays New Note button", async ({ page }) => {
      await expect(page.getByRole("button", { name: "New Note" })).toBeVisible();
    });

    test("displays subject filter dropdown", async ({ page }) => {
      const select = page.locator("select").first();
      await expect(select).toBeVisible();
      await expect(select.locator("option")).toHaveCount(6);
    });

    test("displays pinned notes section", async ({ page }) => {
      await expect(page.locator("text=Pinned")).toBeVisible();
      await expect(page.locator("text=Key Concepts: Cardiovascular Physiology")).toBeVisible();
    });

    test("displays all 6 mock notes", async ({ page }) => {
      await expect(page.locator("text=Key Concepts: Cardiovascular Physiology")).toBeVisible();
      await expect(page.locator("text=Drug Classifications: Antihypertensives")).toBeVisible();
      await expect(page.locator("text=Biochemical Pathways Summary")).toBeVisible();
      await expect(page.locator("text=Neuroanatomy: Brain Stem Structures")).toBeVisible();
      await expect(page.locator("text=Pathology: Myocardial Infarction")).toBeVisible();
      await expect(page.locator("text=Renal Physiology Notes")).toBeVisible();
    });

    test("note cards show subject badges", async ({ page }) => {
      const badge = page.locator(".card span").filter({ hasText: "Physiology" }).first();
      await badge.scrollIntoViewIfNeeded();
      await expect(badge).toBeVisible();
    });

    test("New Note button opens editor modal", async ({ page }) => {
      await page.getByRole("button", { name: "New Note" }).click();
      await expect(page.locator("h2", { hasText: "New Note" })).toBeVisible();
      await expect(page.locator("input[placeholder='Note title']")).toBeVisible();
    });

    test.describe("Editor Modal", () => {
      test.beforeEach(async ({ page }) => {
        await page.getByRole("button", { name: "New Note" }).click();
      });

      test("editor has title, subject, content, and tags fields", async ({ page }) => {
        await expect(page.locator("label", { hasText: "Title" })).toBeVisible();
        await expect(page.locator("label", { hasText: "Subject" })).toBeVisible();
        await expect(page.locator("label", { hasText: "Content" })).toBeVisible();
        await expect(page.locator("label", { hasText: "Tags" })).toBeVisible();
      });

      test("Cancel button closes modal", async ({ page }) => {
        await page.getByRole("button", { name: "Cancel" }).click();
        await expect(page.locator("h2", { hasText: "New Note" })).not.toBeVisible();
      });

      test("Create Note button is disabled without filling required fields", async ({ page }) => {
        await expect(page.getByRole("button", { name: "Create Note" })).toBeVisible();
      });
    });

    test.describe("Filter by Subject", () => {
      test("selecting a subject filters the notes", async ({ page }) => {
        await page.locator("select").first().selectOption("Physiology");
        await expect(page.locator("text=Key Concepts: Cardiovascular Physiology")).toBeVisible();
        await expect(page.locator("text=Drug Classifications: Antihypertensives")).not.toBeVisible();
      });
    });
  });

  test.describe("Mobile viewport", () => {
    test.use({ viewport: MOBILE_VIEWPORT });

    test("note grid stacks to single column", async ({ page }) => {
      await expect(page.locator("text=Key Concepts: Cardiovascular Physiology")).toBeVisible();
    });

    test("New Note button is accessible", async ({ page }) => {
      await expect(page.getByRole("button", { name: "New Note" })).toBeVisible();
    });
  });
});