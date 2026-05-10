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
