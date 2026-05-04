import type { RouteIconKey } from "./icons";

export interface NavItem {
  label: string;
  href: string;
  iconKey: RouteIconKey;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: "Home", href: "/", iconKey: "home" },
  { label: "Tasks", href: "/tasks", iconKey: "tasks" },
  { label: "Reminders", href: "/reminders", iconKey: "reminders" },
  { label: "Notes", href: "/notes", iconKey: "notes" },
];
