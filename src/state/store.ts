import { useCallback, useEffect, useState } from "react";

// Per-device conveniences only (answers, skill switches, history). Storage can throw in private
// mode or be empty; the app must work without it.
function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`recipes:${key}`);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(`recipes:${key}`, JSON.stringify(value));
  } catch {
    // Storage full or blocked: keep the in-memory value.
  }
}

export function usePersisted<T>(key: string, fallback: T): [T, (next: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => read(key, fallback));
  useEffect(() => write(key, value), [key, value]);
  return [value, setValue];
}

export interface HistoryEntry {
  id: string;
  at: string;
  rating?: "loved" | "ok" | "nope";
}

export function useHistory() {
  const [entries, setEntries] = usePersisted<HistoryEntry[]>("history", []);
  const record = useCallback(
    (entry: HistoryEntry) => setEntries((prev) => [entry, ...prev.filter((e) => e.at !== entry.at)].slice(0, 100)),
    [setEntries],
  );
  return { entries, ids: entries.map((e) => e.id), record };
}
