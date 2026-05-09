import { useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

// Mounted at the app root (above HashRouter in App.tsx) because a SW
// update is a global signal, not scoped to any route. The visible
// notification only renders when a new SW has installed and is
// waiting — never on first install or in dev (where vite-plugin-pwa's
// devOptions.enabled is false, so the registration call no-ops and
// needRefresh stays false).
//
// The aria-live region is always in the DOM (with empty content
// initially) so screen readers register it before the announcement
// fires. ARIA-live insertion timing is unreliable across screen
// readers — content changes inside an existing region are reliable.
//
// Clicking "Update and reload" triggers updateServiceWorker(), which
// posts SKIP_WAITING to the new SW; the lib then auto-reloads the
// page when 'controlling' fires. The label names that consequence so
// the user isn't surprised mid-session.
export function UpdateBanner() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  // Track in-flight updates so a double-click can't race the page
  // reload that vite-plugin-pwa fires on 'controlling'.
  const [updating, setUpdating] = useState(false);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-[var(--nav-height)] z-50 mx-auto flex max-w-lg justify-center px-4 pb-2 pointer-events-none"
    >
      {needRefresh && (
        <div className="card pointer-events-auto flex items-center justify-between gap-3 animate-fade-in shadow-md w-full">
          <span className="text-sm font-medium text-text-primary">
            Update available
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setNeedRefresh(false)}
              disabled={updating}
              className="text-sm font-medium text-text-secondary px-3 py-1.5 rounded-md hover:bg-bg-tertiary active:scale-[0.98] transition-all disabled:opacity-60"
            >
              Later
            </button>
            <button
              onClick={() => {
                setUpdating(true);
                updateServiceWorker();
              }}
              disabled={updating}
              className="text-sm font-semibold text-white bg-accent px-3 py-1.5 rounded-md hover:bg-accent-hover active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {updating ? "Updating…" : "Update and reload"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
