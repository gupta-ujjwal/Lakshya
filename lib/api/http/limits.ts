// Route handlers in the App Router don't honour the
// `experimental.serverActions.bodySizeLimit` from next.config.js — that
// setting only applies to Server Actions. To bound POST bodies on regular
// route handlers we read Content-Length ourselves before parsing.

export const MAX_IMPORT_BYTES = 1_048_576; // 1 MiB

export interface BodyLimitFailure {
  ok: false;
  error: string;
}

export interface BodyLimitOk {
  ok: true;
}

export type BodyLimitResult = BodyLimitOk | BodyLimitFailure;

// A header is rejected only when it parses to a number and that number
// exceeds the cap. Missing or unparseable headers fall through — Next will
// still cap the request via its own memory limits when the body is read.
export function checkContentLength(
  header: string | null,
  maxBytes: number
): BodyLimitResult {
  if (header === null || header === "") return { ok: true };
  const parsed = Number.parseInt(header, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return { ok: true };
  if (parsed > maxBytes) {
    return {
      ok: false,
      error: `Request body exceeds ${maxBytes} bytes (got ${parsed}).`,
    };
  }
  return { ok: true };
}
