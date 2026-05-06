import { HashRouter, Outlet, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@/lib/theme-context";
import { DashboardLayout } from "@/pages/DashboardLayout";
import { DashboardPage } from "@/pages/Dashboard";
import { ImportPage } from "@/pages/Import";

// HashRouter is the cheap fix for GitHub Pages: refreshing /import
// otherwise 404s because Pages has no SPA fallback. The 404.html-redirect
// trick keeps clean URLs but is a Phase 2 polish.
export function App() {
  return (
    <ThemeProvider>
      <HashRouter>
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
