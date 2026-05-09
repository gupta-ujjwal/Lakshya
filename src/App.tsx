import { HashRouter, Outlet, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@/lib/theme-context";
import { UpdateBanner } from "@/components/UpdateBanner";
import { DashboardLayout } from "@/pages/DashboardLayout";
import { DashboardPage } from "@/pages/Dashboard";
import { ImportPage } from "@/pages/Import";

// HashRouter is the cheap fix for GitHub Pages: refreshing /import
// otherwise 404s because Pages has no SPA fallback. The 404.html-redirect
// trick keeps clean URLs but is a Phase 3 item — not Phase 2 (PWA).
// The SW's navigateFallback in vite.config.ts is set up to support that
// switch; it's a no-op while HashRouter is active.
export function App() {
  return (
    <ThemeProvider>
      {/* UpdateBanner sits above the router because a SW update is a
          global app signal, not scoped to any route's layout. */}
      <UpdateBanner />
      <HashRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route element={<LayoutOutlet />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/import" element={<ImportPage />} />
          </Route>
        </Routes>
      </HashRouter>
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
