import { useSyncExternalStore } from "react";
import { getState, subscribe } from "../lib/store.js";

/** The whole derived club state. Re-renders when any admin action lands. */
export function useStore() {
  return useSyncExternalStore(subscribe, getState, getState);
}
