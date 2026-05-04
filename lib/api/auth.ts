import type { NextRequest } from "next/server";

// Single-user phase: every API route reads userId from an x-user-id header
// and falls back to the literal "anonymous" if absent. This is NOT real
// auth — anyone can pass any value. When OAuth or magic-link auth lands,
// only this function changes; routes stay as they are.
export function getCurrentUserId(request: NextRequest): string {
  return request.headers.get("x-user-id") || "anonymous";
}
