import type { RouteIconKey } from "./icons";

export interface NavItem {
  label: string;
  href: string;
  iconKey: RouteIconKey;
}

// Order is the daily-loop hierarchy: today (Home) → rhythm (Calendar) →
// browse (Tasks) → manage (Import). The 4-item bar fits comfortably in
// thumb-reach on a typical phone; if a fifth slot is ever proposed, the
// least-used should drop to a "More" overflow rather than cramming.
export const NAV_ITEMS: readonly NavItem[] = [
  { label: "Home", href: "/", iconKey: "home" },
  { label: "Calendar", href: "/calendar", iconKey: "calendar" },
  { label: "Tasks", href: "/tasks", iconKey: "tasks" },
  { label: "Import", href: "/import", iconKey: "import" },
];

// Module-load assertion: catch any future PR that adds a fifth slot
// before deciding whether to demote one to a "More" overflow. The
// thumb-reach trade-off above is the design call; an unenforced
// comment is too easy to ignore.
const MAX_NAV_ITEMS = 4;
if (NAV_ITEMS.length > MAX_NAV_ITEMS) {
  throw new Error(
    `NAV_ITEMS has ${NAV_ITEMS.length} items (max ${MAX_NAV_ITEMS}). ` +
      `Implement a "More" overflow in DashboardLayout before adding another slot.`,
  );
}
