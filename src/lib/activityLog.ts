import { ref, push, set } from 'firebase/database';
import { getFirebaseDB, isFirebaseConfigured } from './firebase';

// ── Types ────────────────────────────────────────────────────────────────────

export interface ActivityLogEntry {
  participantId: string;
  panel: string;
  action: string;
  data?: Record<string, unknown>;
}

// ── Module-level state (no React dependency) ────────────────────────────────

let _trainingCode: string | null = null;

export function setActiveTraining(code: string | null) {
  _trainingCode = code;
}

export function getActiveTraining(): string | null {
  return _trainingCode;
}

// ── Fire-and-forget activity logger ─────────────────────────────────────────

export function logActivity(entry: ActivityLogEntry): void {
  if (!_trainingCode || !isFirebaseConfigured()) return;

  try {
    const db = getFirebaseDB();
    const actRef = ref(db, `training/${_trainingCode}/activities`);
    const newRef = push(actRef);
    set(newRef, { ...entry, timestamp: Date.now() }).catch(() => {});
  } catch {
    // Silently fail — activity log is non-critical
  }
}
