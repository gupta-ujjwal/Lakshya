// Polyfill IndexedDB so Dexie works in Vitest's jsdom environment.
// Without this, any test that touches the repo (and therefore Dexie)
// throws "indexedDB is not defined" before reaching its assertions.
import "fake-indexeddb/auto";

// jsdom doesn't implement matchMedia. The ThemeProvider calls it at
// mount to detect the system color scheme. Stub it to "light" — tests
// don't assert on theme behavior.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
