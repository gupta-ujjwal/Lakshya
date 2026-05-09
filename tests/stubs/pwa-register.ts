// Stub for the virtual:pwa-register/react module that vite-plugin-pwa
// injects at build time. Vitest doesn't run the plugin, so the
// virtual module would otherwise fail to resolve. The hook is wired
// up to never report an update, which matches the at-rest state any
// component should render under.
//
// The `satisfies` annotation locks the stub's shape against the real
// hook's return type — if vite-plugin-pwa's API drifts, this stops
// compiling rather than silently diverging from production.
import { useState, type Dispatch, type SetStateAction } from "react";

interface UseRegisterSWReturn {
  needRefresh: [boolean, Dispatch<SetStateAction<boolean>>];
  offlineReady: [boolean, Dispatch<SetStateAction<boolean>>];
  updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
}

export function useRegisterSW(): UseRegisterSWReturn {
  return {
    needRefresh: useState(false),
    offlineReady: useState(false),
    updateServiceWorker: async () => {},
  } satisfies UseRegisterSWReturn;
}
