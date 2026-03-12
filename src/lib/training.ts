import {
  ref,
  set,
  get,
  onValue,
  update,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/database';
import { getFirebaseDB, isFirebaseConfigured } from './firebase';
import type { Participant } from '../store/types';

// ── Types ────────────────────────────────────────────────────────────────────

export interface TrainingParticipant {
  name: string;
  first: string;
  last: string;
  checkedIn: boolean;
  checkedInAt: number | null;
}

export interface ActivityEntry {
  participantId: string;
  panel: string;
  action: string;
  data?: Record<string, unknown>;
  timestamp: number;
}

// ── Room code generation (shared with room.ts pattern) ──────────────────────

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ── localStorage persistence ────────────────────────────────────────────────

const STORAGE_KEY = 'wodzirej-training-session';

export function getSavedTraining(): { trainingCode: string; title: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveTrainingLocal(trainingCode: string, title: string) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ trainingCode, title }));
}

export function clearTrainingLocal() {
  localStorage.removeItem(STORAGE_KEY);
}

// ── Create training session ─────────────────────────────────────────────────

export async function createTraining(title?: string): Promise<string> {
  const db = getFirebaseDB();
  const code = generateCode();
  const trainingRef = ref(db, `training/${code}`);

  await set(trainingRef, {
    createdAt: serverTimestamp(),
    status: 'open',
    title: title || '',
  });

  saveTrainingLocal(code, title || '');
  return code;
}

// ── Upload participants to training session ─────────────────────────────────

export async function uploadParticipants(
  trainingCode: string,
  participants: Participant[],
): Promise<void> {
  const db = getFirebaseDB();
  const updates: Record<string, TrainingParticipant> = {};

  for (const p of participants) {
    updates[p.id] = {
      name: p.text,
      first: p.first,
      last: p.last,
      checkedIn: false,
      checkedInAt: null,
    };
  }

  await set(ref(db, `training/${trainingCode}/participants`), updates);
}

// ── Check-in participant ────────────────────────────────────────────────────

export async function checkInParticipant(
  trainingCode: string,
  participantId: string,
): Promise<void> {
  const db = getFirebaseDB();
  await update(ref(db, `training/${trainingCode}/participants/${participantId}`), {
    checkedIn: true,
    checkedInAt: Date.now(),
  });
}

// ── Join training (verify it exists and is open) ────────────────────────────

export async function joinTraining(
  code: string,
): Promise<{ ok: true; title: string; participants: Record<string, TrainingParticipant> } | { ok: false; reason: string }> {
  if (!isFirebaseConfigured()) return { ok: false, reason: 'Firebase nie skonfigurowany' };

  const db = getFirebaseDB();
  const snap = await get(ref(db, `training/${code}`));

  if (!snap.exists()) return { ok: false, reason: 'Sesja szkoleniowa nie istnieje' };
  const data = snap.val();
  if (data.status === 'closed') return { ok: false, reason: 'Szkolenie zakończone' };

  return {
    ok: true,
    title: data.title || '',
    participants: data.participants || {},
  };
}

// ── Listen to check-in changes (real-time) ──────────────────────────────────

export function onCheckIns(
  trainingCode: string,
  callback: (checkins: Record<string, boolean>) => void,
): Unsubscribe {
  const db = getFirebaseDB();
  return onValue(ref(db, `training/${trainingCode}/participants`), (snap) => {
    const raw = snap.val() as Record<string, TrainingParticipant> | null;
    if (!raw) { callback({}); return; }

    const result: Record<string, boolean> = {};
    for (const [id, p] of Object.entries(raw)) {
      result[id] = p.checkedIn;
    }
    callback(result);
  });
}

// ── Fetch all activities (one-time read for reports) ────────────────────────

export async function fetchActivities(
  trainingCode: string,
): Promise<ActivityEntry[]> {
  const db = getFirebaseDB();
  const snap = await get(ref(db, `training/${trainingCode}/activities`));
  const raw = snap.val() as Record<string, ActivityEntry> | null;
  if (!raw) return [];

  return Object.values(raw).sort((a, b) => a.timestamp - b.timestamp);
}

// ── Close training session ──────────────────────────────────────────────────

export async function closeTraining(trainingCode: string): Promise<void> {
  const db = getFirebaseDB();
  await set(ref(db, `training/${trainingCode}/status`), 'closed');
}

// ── Get check-in URL for QR code ────────────────────────────────────────────

export function getTrainingURL(trainingCode: string): string {
  const base = window.location.origin + import.meta.env.BASE_URL;
  return `${base}#checkin/${trainingCode}`;
}
