import type { RouteIconKey } from "./icons";

export interface NavItem {
  label: string;
  href: string;
  iconKey: RouteIconKey;
}

// Phase 1 ships only the dashboard and import flows. Tasks/Notes/Reminders
// were aspirational entries in the original Next.js build; remove until
// each has a real page behind it.
export const NAV_ITEMS: readonly NavItem[] = [
  { label: "Home", href: "/", iconKey: "home" },
  { label: "Import", href: "/import", iconKey: "import" },
];
