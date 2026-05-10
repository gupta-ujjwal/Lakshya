import { today } from "./dates";

// The "study X today" pin is render-layer ephemera, not persistence
// volatility — it expires at midnight by definition. localStorage with
// a date stamp gives us auto-clear (a stale date returns []) without
// a Dexie migration or a midnight cron. Multiple subjects can be
// pinned at once; the user's pinning Pathology + Microbiology together
// is a normal case, not a multi-step interaction.
const STORAGE_KEY = "lakshya:focus";

interface StoredPin {
  date: string;
  subjects: string[];
}

function read(): StoredPin | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const obj = parsed as Record<string, unknown>;
    if (typeof obj.date !== "string" || !Array.isArray(obj.subjects)) {
      return null;
    }
    const subjects = obj.subjects.filter(
      (s): s is string => typeof s === "string",
    );
    return { date: obj.date, subjects };
  } catch {
    return null;
  }
}

function write(pin: StoredPin): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pin));
}

export function getPinnedSubjects(): string[] {
  const pin = read();
  if (!pin || pin.date !== today()) return [];
  return pin.subjects;
}

export function isSubjectPinned(subject: string): boolean {
  return getPinnedSubjects().includes(subject);
}

export function pinSubject(subject: string): void {
  const current = getPinnedSubjects();
  if (current.includes(subject)) return;
  write({ date: today(), subjects: [...current, subject] });
}

export function unpinSubject(subject: string): void {
  const current = getPinnedSubjects();
  if (!current.includes(subject)) return;
  write({ date: today(), subjects: current.filter((s) => s !== subject) });
}

export function clearAllPins(): void {
  localStorage.removeItem(STORAGE_KEY);
}
