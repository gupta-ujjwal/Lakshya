// Polyfill IndexedDB so Dexie works in Vitest's jsdom environment.
// Without this, any test that touches the repo (and therefore Dexie)
// throws "indexedDB is not defined" before reaching its assertions.
import "fake-indexeddb/auto";
