import { NavLink } from "react-router-dom";
import { StatusBar } from "@/components/StatusBar";
import { ROUTE_ICONS } from "@/lib/icons";
import { NAV_ITEMS } from "@/lib/navigation";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-primary pb-20">
      <StatusBar />
      <main className="max-w-lg mx-auto px-4 pt-4">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 bg-bg-secondary border-t border-border safe-area-bottom z-50">
        <div className="max-w-lg mx-auto flex items-center justify-around h-14">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === "/"}
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
            >
              {ROUTE_ICONS[item.iconKey]}
              <span className="text-xs">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
