import { useCallback, useSyncExternalStore } from 'react';
import { EXTRA_TABS, type ExtraTab } from './types';

const STORAGE_KEY = 'wodzirej-enabled-tabs';

function loadEnabled(): Set<ExtraTab> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(arr.filter((t) => (EXTRA_TABS as readonly string[]).includes(t)) as ExtraTab[]);
  } catch {
    return new Set();
  }
}

function saveEnabled(s: Set<ExtraTab>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...s]));
}

// Simple reactive store outside React
let _enabled = loadEnabled();
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

function getSnapshot(): Set<ExtraTab> {
  return _enabled;
}

export function useEnabledTabs() {
  const enabled = useSyncExternalStore(subscribe, getSnapshot);

  const toggle = useCallback((tab: ExtraTab) => {
    const next = new Set(_enabled);
    if (next.has(tab)) next.delete(tab);
    else next.add(tab);
    _enabled = next;
    saveEnabled(next);
    notify();
  }, []);

  const isEnabled = useCallback((tab: ExtraTab) => enabled.has(tab), [enabled]);

  return { enabled, toggle, isEnabled };
}
