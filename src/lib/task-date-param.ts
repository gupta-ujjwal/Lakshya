// The /tasks page accepts a `?date=YYYY-MM-DD` query param to pin its
// view to one day; /calendar produces those URLs when a cell is tapped.
// Both ends going through this module keeps the token name and the
// format check from drifting if either page is rewritten.

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const TASK_DATE_PARAM = "date";

/** Returns the param name=value pair for inserting into a search string. */
export function encodeTaskDate(dateKey: string): string {
  return `${TASK_DATE_PARAM}=${dateKey}`;
}

/** Validates and returns the date key, or null if absent / malformed. */
export function decodeTaskDate(raw: string | null): string | null {
  if (!raw) return null;
  if (!DATE_PATTERN.test(raw)) return null;
  // Sanity: reject "0000-99-99" and similar by round-tripping through Date.
  const parsed = new Date(`${raw}T00:00:00.000Z`);
  if (isNaN(parsed.getTime())) return null;
  return raw;
}
