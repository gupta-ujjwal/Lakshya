// Stub for the virtual:pwa-register/react module that vite-plugin-pwa
// injects at build time. Vitest doesn't run the plugin, so the
// virtual module would otherwise fail to resolve. The hook is wired
// up to never report an update, which matches the at-rest state any
// component should render under.
import { useState } from "react";

export function useRegisterSW() {
  const needRefreshState = useState(false);
  const offlineReadyState = useState(false);
  return {
    needRefresh: needRefreshState,
    offlineReady: offlineReadyState,
    updateServiceWorker: async () => {},
  };
}
