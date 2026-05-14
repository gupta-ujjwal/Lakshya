import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3002";
const OUT = "/tmp/lakshya-evidence-pr43-v2";
fs.mkdirSync(OUT, { recursive: true });

const log = [];
const ok = (msg, extra) => log.push(`✅ ${msg}${extra ? "  — " + extra : ""}`);
const info = (msg, extra) =>
  log.push(`ℹ️  ${msg}${extra ? "  — " + extra : ""}`);
const fail = (msg, extra) => {
  log.push(`❌ ${msg}${extra ? "  — " + extra : ""}`);
  console.error("FAIL:", msg, extra ?? "");
  process.exitCode = 1;
};

function sample() {
  const target = new Date();
  target.setUTCDate(target.getUTCDate() + 180);
  return {
    title: "NEET PG Preparation Schedule",
    description: "Comprehensive study plan for NEET PG examination",
    targetDate: target.toISOString().split("T")[0],
    cycleLengthDays: 7,
    hoursPerDay: 6,
    timetable: [
      { dayNumber: 1, slots: [{ subject: "Anatomy", topic: "General Anatomy" }, { subject: "Physiology" }] },
      { dayNumber: 2, slots: [{ subject: "Biochemistry" }, { subject: "Pathology" }] },
      { dayNumber: 3, slots: [{ subject: "Microbiology" }, { subject: "Pharmacology" }] },
      { dayNumber: 4, slots: [{ subject: "Forensic Medicine" }, { subject: "Medicine" }] },
      { dayNumber: 5, slots: [{ subject: "Surgery" }, { subject: "Obstetrics" }] },
      { dayNumber: 6, slots: [{ subject: "Gynecology" }, { subject: "Pediatrics" }] },
      { dayNumber: 7, slots: [{ subject: "ENT" }, { subject: "Ophthalmology" }] },
    ],
  };
}

const samplePath = path.join(OUT, "sample.json");
fs.writeFileSync(samplePath, JSON.stringify(sample(), null, 2));

// Set CHROMIUM_PATH if the bundled browser doesn't match (e.g. on Nix
// where the playwright-core auto-download trips on glibc/libstdc++).
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH,
});
const ctx = await browser.newContext({
  viewport: { width: 420, height: 900 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();

const consoleErrors = [];
page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push(`console.error: ${m.text()}`);
});

async function shot(name) {
  const file = path.join(OUT, `evidence-pr-43-${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  info(`Screenshot: ${name}`, file);
}

log.push("## Setup\n");

// 1) Cold start → /import
await page.goto(BASE + "/", { waitUntil: "networkidle" });
const url1 = page.url();
if (url1.endsWith("/import")) ok("Cold start redirects to /import (no schedule)", `url=${url1}`);
else fail("Expected redirect to /import", `url=${url1}`);

// 2) Upload sample
await page.locator('#file-input').setInputFiles(samplePath);
await page.getByRole("button", { name: /Import Schedule/i }).click();
// success state shows "Schedule imported successfully!", then we navigate
await page.waitForSelector("text=Schedule imported successfully!", { timeout: 8000 });
ok("Imported sample schedule");
await page.goto(BASE + "/", { waitUntil: "networkidle" });
ok("Dashboard loaded", `url=${page.url()}`);

log.push("\n## PR-specific flows (append semantics)\n");

// 3) Card renders, count = 0
const card = page.getByTestId("mcq-counter");
await card.waitFor();
ok("MCQ counter card renders on dashboard");

const display = page.getByTestId("mcq-counter-display");
const initialText = (await display.innerText()).trim();
if (initialText === "0") ok("Initial MCQ count reads '0'", `text="${initialText}"`);
else fail("Initial count not 0", `text="${initialText}"`);

// textContent (not innerText) so the CSS uppercase transform doesn't shout
const eyebrow = (await card.locator("p").first().textContent())?.trim();
if (eyebrow === "MCQs solved today") ok("Eyebrow label reads 'MCQs solved today'", `text="${eyebrow}"`);
else fail("Eyebrow label mismatch", `text="${eyebrow}"`);

const meta0 = await page.getByTestId("mcq-counter-meta").innerText();
if (meta0 === "7-day avg: 0") ok("Day-0 meta shows bare '7-day avg: 0' (no green/red verdict yet)", `text="${meta0}"`);
else fail("Day-0 meta unexpected", `text="${meta0}"`);

await shot("dashboard-idle");

// 4) Tap → edit mode (input EMPTY, '+' glyph between current total and input)
await display.click();
const input = page.getByTestId("mcq-counter-input");
await input.waitFor();
ok("Tapping the number swaps in an <input>");

// Two rAFs to give the requestAnimationFrame focus() time to land
const focused = await page.evaluate(
  () =>
    new Promise((resolve) => {
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          const el = document.querySelector('[data-testid="mcq-counter-input"]');
          resolve(document.activeElement === el);
        }),
      );
    }),
);
if (focused) ok("Input is auto-focused after tap (rAF focus)");
else fail("Input not auto-focused");

const inputType = await input.getAttribute("type");
if (inputType === "number") ok("Input type is 'number'", `type="${inputType}"`);
else fail("Input type wrong", `type="${inputType}"`);

const initialDraft = await input.inputValue();
if (initialDraft === "") ok("Input opens EMPTY (append semantics, not pre-populated with current count)", `value="${initialDraft}"`);
else fail("Input not empty on open — append semantics broken", `value="${initialDraft}"`);

// '+' glyph visible between running total and input
const plusGlyph = await card.locator("span", { hasText: "+" }).first().innerText();
if (plusGlyph === "+") ok("'+' glyph rendered between running total and input (append affordance)");
else fail("'+' glyph missing", `text="${plusGlyph}"`);

const runningTotalDuringEdit = await page.getByTestId("mcq-counter-running-total").innerText();
if (runningTotalDuringEdit === "0") ok("Running total stays visible during edit", `text="${runningTotalDuringEdit}"`);
else fail("Running total not shown during edit", `text="${runningTotalDuringEdit}"`);

await shot("edit-mode-empty");

// 5) Type '50' + Enter → display becomes 50
await input.fill("50");
await input.press("Enter");
await page.waitForFunction(
  () => document.querySelector('[data-testid="mcq-counter-display"]')?.textContent?.trim() === "50",
  null, { timeout: 3000 },
);
const after50 = (await display.innerText()).trim();
ok("Enter commits +50 → display reads '50'", `text="${after50}"`);

// Delta indicator now ahead (50 vs avg 7)
const meta50 = await page.getByTestId("mcq-counter-meta").innerText();
if (/▲ \d+ above 7-day avg/.test(meta50)) ok("Delta indicator goes GREEN '▲ N above 7-day avg (M)'", `text="${meta50}"`);
else fail("Delta indicator not green/above as expected", `text="${meta50}"`);

const meta50Class = await page.getByTestId("mcq-counter-meta").getAttribute("class");
if (meta50Class?.includes("text-success")) ok("Delta indicator uses text-success token when ahead");
else fail("Delta indicator missing text-success", `class="${meta50Class}"`);

await shot("after-add-50");

// 6) Append a second batch: tap → input → type 23 → Enter → expect 73 (50+23)
await display.click();
await input.waitFor();
const draft2 = await input.inputValue();
if (draft2 === "") ok("Re-entering edit mode also opens with empty input (no stale draft)", `value="${draft2}"`);
else fail("Edit mode reopened with non-empty input", `value="${draft2}"`);

const runningTotalDuringEdit2 = await page.getByTestId("mcq-counter-running-total").innerText();
if (runningTotalDuringEdit2 === "50") ok("Running total in edit mode shows current 50 (visual proof of append)", `text="${runningTotalDuringEdit2}"`);
else fail("Running total in edit mode wrong", `text="${runningTotalDuringEdit2}"`);

await input.fill("23");
await shot("edit-mode-50-plus-23");

await input.press("Enter");
await page.waitForFunction(
  () => document.querySelector('[data-testid="mcq-counter-display"]')?.textContent?.trim() === "73",
  null, { timeout: 3000 },
);
const after73 = (await display.innerText()).trim();
ok("Append works: 50 + 23 → display reads '73' (NOT '23')", `text="${after73}"`);

const meta73 = await page.getByTestId("mcq-counter-meta").innerText();
ok("Delta indicator updates after append", `text="${meta73}"`);

await shot("after-append-23");

// 7) Persistence
await page.reload({ waitUntil: "networkidle" });
await page.getByTestId("mcq-counter-display").waitFor();
const afterReload = (await page.getByTestId("mcq-counter-display").innerText()).trim();
if (afterReload === "73") ok("MCQ count persists across page.reload() (still '73')", `text="${afterReload}"`);
else fail("Persistence broken after reload", `text="${afterReload}"`);

await shot("after-reload-persisted");

// 8) Escape discards draft, no append
await page.getByTestId("mcq-counter-display").click();
await page.getByTestId("mcq-counter-input").waitFor();
await page.getByTestId("mcq-counter-input").fill("999");
await page.getByTestId("mcq-counter-input").press("Escape");
await page.getByTestId("mcq-counter-display").waitFor();
const afterEscape = (await page.getByTestId("mcq-counter-display").innerText()).trim();
if (afterEscape === "73") ok("Escape discards the draft (display still '73', no append)", `text="${afterEscape}"`);
else fail("Escape did not discard — display moved", `text="${afterEscape}"`);

// 9) Dark mode
await page.goto(BASE + "/import", { waitUntil: "networkidle" });
const themeToggle = page.getByRole("button", { name: /theme|dark|light/i }).first();
await themeToggle.click();
const isDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
if (isDark) ok("Dark mode applied (html.dark)");
else fail("Dark mode not applied");

await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.getByTestId("mcq-counter-display").waitFor();
const darkText = (await page.getByTestId("mcq-counter-display").innerText()).trim();
if (darkText === "73") ok("MCQ card still reads '73' in dark mode", `text="${darkText}"`);

await shot("dashboard-dark");

log.push("\n## Pinned design rules\n");

const displayClass = await page.getByTestId("mcq-counter-display").getAttribute("class");
if (displayClass?.includes("min-h-[44px]")) ok("MCQ display button has min-h-[44px] touch target");
else fail("min-h-[44px] missing on display button", `class="${displayClass}"`);

const eyebrowClass = await card.locator("p").first().getAttribute("class");
if (eyebrowClass?.includes("text-accent-strong")) ok("Eyebrow uses text-accent-strong (AA token)", `class="${eyebrowClass}"`);
else fail("Eyebrow missing text-accent-strong", `class="${eyebrowClass}"`);

// DOM order: stats grid → mcq → tasks
const order = await page.evaluate(() => {
  const all = [...document.querySelectorAll("*")];
  const mcqIdx = all.findIndex((n) => n.getAttribute("data-testid") === "mcq-counter");
  // The leaf "Day streak" label is a small <p>/<span> with no children.
  const statsLeaf = all.find(
    (n) => n.children.length === 0 && n.textContent?.trim() === "day streak",
  );
  const statsIdx = statsLeaf ? all.indexOf(statsLeaf) : -1;
  // Find the LAST element whose own text equals "Today's Tasks" — the
  // <h2>, not its containing card. textContent on ancestors trivially matches.
  const tasksHeading = [...document.querySelectorAll("h2")].find(
    (h) => h.textContent?.trim() === "Today's Tasks",
  );
  const tasksIdx = tasksHeading ? all.indexOf(tasksHeading) : -1;
  return { mcqIdx, statsIdx, tasksIdx };
});
if (order.statsIdx > 0 && order.statsIdx < order.mcqIdx && order.mcqIdx < order.tasksIdx)
  ok("MCQ card sits AFTER stats grid AND BEFORE Today's Tasks in DOM order", JSON.stringify(order));
else fail("DOM order wrong", JSON.stringify(order));

// No ±N stepper buttons (the lone button is the running-total display itself).
// A stepper would be a <button> whose text is exactly "+", "-", "+1", or "-1" —
// the display button's text is the multi-digit count, which is fine.
const stepperCount = await page.evaluate(() => {
  const card = document.querySelector('[data-testid="mcq-counter"]');
  if (!card) return -1;
  const buttons = [...card.querySelectorAll("button")];
  return buttons.filter((b) =>
    /^[+-]\d*$/.test(b.textContent?.trim() ?? ""),
  ).length;
});
if (stepperCount === 0)
  ok("No ±N stepper buttons inside the MCQ card (tap-to-add only)", `stepperCount=${stepperCount}`);
else fail(`Found ${stepperCount} stepper buttons`, "");

log.push("\n## Console / page errors\n");
if (consoleErrors.length === 0) log.push("_(none)_");
else consoleErrors.forEach((e) => log.push(`  - ${e}`));

await browser.close();

const transcript = log.join("\n") + "\n";
fs.writeFileSync(path.join(OUT, "transcript-pr-43.txt"), transcript);
process.stdout.write(transcript);
