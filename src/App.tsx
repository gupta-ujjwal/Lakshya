import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@/lib/theme-context";
import { UpdateBanner } from "@/components/UpdateBanner";
import { DashboardLayout } from "@/pages/DashboardLayout";
import { DashboardPage } from "@/pages/Dashboard";
import { ImportPage } from "@/pages/Import";
import { TasksPage } from "@/pages/Tasks";
import { CalendarPage } from "@/pages/Calendar";

// BrowserRouter — GitHub Pages doesn't have an SPA fallback, but
// public/404.html + the decoder script in index.html implement one
// via the rafgraph technique. The SW's navigateFallback handles
// post-install reloads from cache. basename is derived from
// import.meta.env.BASE_URL, which Vite injects from the `base:` field
// in vite.config.ts (sourced from VITE_BASE in CI). Asset prefix and
// router basename happen to match here; they would diverge under a
// reverse-proxy that rewrites paths — see the comment on `base:` in
// vite.config.ts for the escape hatch.
export function App() {
  return (
    <ThemeProvider>
      {/* UpdateBanner sits above the router because a SW update is a
          global app signal, not scoped to any route's layout. */}
      <UpdateBanner />
      <BrowserRouter
        basename={import.meta.env.BASE_URL}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route element={<LayoutOutlet />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/import" element={<ImportPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

function LayoutOutlet() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
