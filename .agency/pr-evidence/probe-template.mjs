// Template for /do's evidence-step Playwright probe.
// Copy to /tmp/qa-lakshya/probe-pr-<NUMBER>.mjs, then replace the
// "PR-specific flows" and "Direct URL navigation" sections with the
// routes / components this PR introduces. See .agency/do.md → "PR
// evidence" for the surrounding workflow.
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3002";
const ART = "/tmp/qa-lakshya/artifacts";
const PR = process.env.PR_NUMBER ?? "TBD";

function log(step, ok, info = "") {
  const tag = ok === true ? "✅" : ok === false ? "❌" : "ℹ️ ";
  console.log(`${tag} ${step}${info ? "  — " + info : ""}`);
}

async function shot(page, name) {
  const path = `${ART}/evidence-pr-${PR}-${name}.png`;
  await page.screenshot({ path, fullPage: true });
  log(`Screenshot: ${name}`, null, path);
}

const browser = await chromium.launch({
  executablePath: "/opt/google/chrome/chrome",
  headless: true,
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
  viewport: { width: 420, height: 900 },
  acceptDownloads: true,
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push("[pageerror] " + e.message));
page.on(
  "console",
  (m) => m.type() === "error" && errors.push("[console.error] " + m.text()),
);

// --- Setup ----------------------------------------------------------------

console.log("## Setup\n");

await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
await page.evaluate(async () => {
  const dbs = await indexedDB.databases();
  await Promise.all(
    dbs.map(
      (d) =>
        new Promise((r) => {
          const x = indexedDB.deleteDatabase(d.name);
          x.onsuccess = x.onerror = x.onblocked = () => r();
        }),
    ),
  );
});
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
await new Promise((r) => setTimeout(r, 400));
log("Cold start redirects to /import (no schedule)", page.url().includes("/import"), `url=${page.url()}`);

const sample = readFileSync(`${ART}/sample-schedule.json`, "utf-8");
await page.setInputFiles("#file-input", {
  name: "sample.json",
  mimeType: "application/json",
  buffer: Buffer.from(sample),
});
await new Promise((r) => setTimeout(r, 200));
await page.getByRole("button", { name: "Import Schedule" }).click();
await page.waitForSelector("text=Schedule imported successfully!", { timeout: 5000 });
log("Imported sample schedule", true);
await page.getByRole("link", { name: "View Dashboard" }).click();
await new Promise((r) => setTimeout(r, 600));
log("Dashboard loaded", page.url() === `${BASE}/`, `url=${page.url()}`);

// --- PR-specific flows ----------------------------------------------------

console.log("\n## PR-specific flows\n");

// TODO: replace this block with the routes / components this PR introduces.
// Each distinct user-visible behavior gets one `log(...)` line. Screenshots
// only at meaningful decision points — default state, key filter applied,
// drill-down landing, post-action effect — not one per step.
//
// Example shape:
//   await page.getByRole("link", { name: "Tasks" }).click();
//   await new Promise((r) => setTimeout(r, 600));
//   log("Bottom-nav Tasks → /tasks", page.url().endsWith("/tasks"));
//   await shot(page, "tasks-default");
//
//   await page.getByRole("button", { name: "Anatomy", exact: true }).click();
//   await new Promise((r) => setTimeout(r, 400));
//   log("Subject filter narrows the list", /* … */);
//   await shot(page, "tasks-filtered");

// --- Direct-URL refresh checks --------------------------------------------

console.log("\n## Direct URL navigation\n");

// TODO: for every new route, page.goto + assert it renders. This catches
// SPA-fallback regressions on a cold load (the route works after install,
// but does it work fresh?).
//
//   await page.goto(`${BASE}/tasks`, { waitUntil: "networkidle" });
//   await new Promise((r) => setTimeout(r, 400));
//   log("Refresh on /tasks serves the page", await page.locator("h1:has-text('Tasks')").isVisible());

// --- Pinned rules ---------------------------------------------------------

console.log("\n## Pinned design rules\n");

// TODO: when hickey/lowy pin a behavioral rule on this PR (e.g. "today
// partial stays in 'todo' tone"), include the assertion here so the
// probe is the regression net. One assertion per pinned rule.

// --- Errors ---------------------------------------------------------------

console.log("\n## Console / page errors\n");
console.log(errors.length === 0 ? "_(none)_" : errors.join("\n"));

await browser.close();
process.exit(errors.length === 0 ? 0 : 1);
