import {
  ref,
  push,
  set,
  get,
  onValue,
  update,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/database';
import { getFirebaseDB } from './firebase';

// ── Types ────────────────────────────────────────────────────────────────────

export interface RoomWord {
  word: string;
  timestamp: number;
}

export interface RoomData {
  createdAt: unknown;
  status: 'open' | 'closed';
  question: string;
}

export interface WordEntry {
  id: string;
  word: string;
  count: number;
}

// ── Session types (shared sessions for QR self-registration + quiz) ──────────

export interface SessionParticipant {
  name: string;
  joinedAt: number;
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  timeLimit: number;
}

// ── Room code generation ─────────────────────────────────────────────────────

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ── Create room (wordcloud) ──────────────────────────────────────────────────

export async function createRoom(question: string): Promise<string> {
  const db = getFirebaseDB();
  const code = generateRoomCode();
  const roomRef = ref(db, `rooms/${code}`);

  await set(roomRef, {
    createdAt: serverTimestamp(),
    status: 'open',
    question,
  });

  return code;
}

// ── Create session (for participant self-registration) ───────────────────────

export async function createSession(): Promise<string> {
  const db = getFirebaseDB();
  const code = generateRoomCode();
  const sessionRef = ref(db, `sessions/${code}`);

  await set(sessionRef, {
    createdAt: serverTimestamp(),
    status: 'open',
  });

  return code;
}

// ── Register participant in session ──────────────────────────────────────────

export async function registerParticipant(
  sessionId: string,
  name: string,
): Promise<{ ok: boolean; participantId?: string; reason?: string }> {
  const db = getFirebaseDB();
  const sessionRef = ref(db, `sessions/${sessionId}`);
  const snap = await get(sessionRef);

  if (!snap.exists()) return { ok: false, reason: 'Sesja nie istnieje' };
  const data = snap.val();
  if (data.status === 'closed') return { ok: false, reason: 'Sesja zakończona' };

  const pRef = ref(db, `sessions/${sessionId}/participants`);
  const newRef = push(pRef);
  await set(newRef, { name: name.trim(), joinedAt: Date.now() });

  return { ok: true, participantId: newRef.key! };
}

// ── Listen to session participants ───────────────────────────────────────────

export function onSessionParticipants(
  sessionId: string,
  callback: (participants: Array<{ id: string; name: string }>) => void,
): Unsubscribe {
  const db = getFirebaseDB();
  const pRef = ref(db, `sessions/${sessionId}/participants`);

  return onValue(pRef, (snapshot) => {
    const raw = snapshot.val() as Record<string, SessionParticipant> | null;
    if (!raw) { callback([]); return; }
    const list = Object.entries(raw).map(([id, p]) => ({ id, name: p.name }));
    callback(list);
  });
}

// ── Close session ────────────────────────────────────────────────────────────

export async function closeSession(sessionId: string): Promise<void> {
  const db = getFirebaseDB();
  await set(ref(db, `sessions/${sessionId}/status`), 'closed');
}

// ── Listen to session status ─────────────────────────────────────────────────

export function onSessionStatus(
  sessionId: string,
  callback: (status: 'open' | 'closed') => void,
): Unsubscribe {
  const db = getFirebaseDB();
  return onValue(ref(db, `sessions/${sessionId}/status`), (snap) => {
    callback(snap.val() || 'closed');
  });
}

// ── Quiz: publish question ───────────────────────────────────────────────────

export async function publishQuizQuestion(
  sessionId: string,
  question: QuizQuestion,
): Promise<void> {
  const db = getFirebaseDB();
  await set(ref(db, `sessions/${sessionId}/quiz/current`), {
    ...question,
    startedAt: Date.now(),
  });
}

// ── Quiz: clear current question ─────────────────────────────────────────────

export async function clearQuizQuestion(sessionId: string): Promise<void> {
  const db = getFirebaseDB();
  await set(ref(db, `sessions/${sessionId}/quiz/current`), null);
}

// ── Quiz: submit answer ──────────────────────────────────────────────────────

export async function submitQuizAnswer(
  sessionId: string,
  questionId: string,
  participantId: string,
  answerIndex: number,
  timeMs: number,
  correct: boolean,
): Promise<void> {
  const db = getFirebaseDB();
  const ansRef = ref(db, `sessions/${sessionId}/quiz/answers/${questionId}/${participantId}`);
  await set(ansRef, { answerIndex, timeMs, correct, timestamp: Date.now() });
}

// ── Quiz: listen to current question ─────────────────────────────────────────

export function onQuizQuestion(
  sessionId: string,
  callback: (q: (QuizQuestion & { startedAt: number }) | null) => void,
): Unsubscribe {
  const db = getFirebaseDB();
  return onValue(ref(db, `sessions/${sessionId}/quiz/current`), (snap) => {
    callback(snap.val() || null);
  });
}

// ── Quiz: listen to answers for a question ───────────────────────────────────

export function onQuizAnswers(
  sessionId: string,
  questionId: string,
  callback: (answers: Record<string, { answerIndex: number; timeMs: number; correct: boolean }>) => void,
): Unsubscribe {
  const db = getFirebaseDB();
  return onValue(ref(db, `sessions/${sessionId}/quiz/answers/${questionId}`), (snap) => {
    callback(snap.val() || {});
  });
}

// ── Quiz: update scores in session ───────────────────────────────────────────

export async function updateQuizScores(
  sessionId: string,
  scores: Record<string, number>,
): Promise<void> {
  const db = getFirebaseDB();
  await update(ref(db, `sessions/${sessionId}/quiz/scores`), scores);
}

// ── Quiz: listen to scores ───────────────────────────────────────────────────

export function onQuizScores(
  sessionId: string,
  callback: (scores: Record<string, number>) => void,
): Unsubscribe {
  const db = getFirebaseDB();
  return onValue(ref(db, `sessions/${sessionId}/quiz/scores`), (snap) => {
    callback(snap.val() || {});
  });
}

// ── Join room (check if exists and open) ─────────────────────────────────────

export async function joinRoom(code: string): Promise<{ ok: true; question: string } | { ok: false; reason: string }> {
  const db = getFirebaseDB();
  const roomRef = ref(db, `rooms/${code}`);
  const snapshot = await get(roomRef);

  if (!snapshot.exists()) {
    return { ok: false, reason: 'Pokój nie istnieje' };
  }

  const data = snapshot.val() as RoomData;
  if (data.status === 'closed') {
    return { ok: false, reason: 'Sesja została zakończona' };
  }

  return { ok: true, question: data.question };
}

// ── Join session (check if exists and open) ──────────────────────────────────

export async function joinSession(code: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  const db = getFirebaseDB();
  const sessionRef = ref(db, `sessions/${code}`);
  const snapshot = await get(sessionRef);

  if (!snapshot.exists()) return { ok: false, reason: 'Sesja nie istnieje' };
  const data = snapshot.val();
  if (data.status === 'closed') return { ok: false, reason: 'Sesja zakończona' };

  return { ok: true };
}

// ── Submit word ──────────────────────────────────────────────────────────────

export async function submitWord(roomId: string, word: string): Promise<void> {
  const db = getFirebaseDB();
  const wordsRef = ref(db, `rooms/${roomId}/words`);
  await push(wordsRef, {
    word: word.trim().toLowerCase(),
    timestamp: Date.now(),
  });
}

// ── Listen to words (real-time) ──────────────────────────────────────────────

export function onWordsChange(
  roomId: string,
  callback: (words: WordEntry[]) => void,
): Unsubscribe {
  const db = getFirebaseDB();
  const wordsRef = ref(db, `rooms/${roomId}/words`);

  return onValue(wordsRef, (snapshot) => {
    const raw = snapshot.val() as Record<string, RoomWord> | null;
    if (!raw) {
      callback([]);
      return;
    }

    const wordMap = new Map<string, number>();
    for (const entry of Object.values(raw)) {
      const w = entry.word.trim().toLowerCase();
      wordMap.set(w, (wordMap.get(w) || 0) + 1);
    }

    const entries: WordEntry[] = [];
    let idx = 0;
    for (const [word, count] of wordMap) {
      entries.push({ id: `fb-${idx++}`, word, count });
    }

    entries.sort((a, b) => b.count - a.count);
    callback(entries);
  });
}

// ── Listen to room status ────────────────────────────────────────────────────

export function onRoomStatus(
  roomId: string,
  callback: (status: 'open' | 'closed') => void,
): Unsubscribe {
  const db = getFirebaseDB();
  const statusRef = ref(db, `rooms/${roomId}/status`);

  return onValue(statusRef, (snapshot) => {
    callback(snapshot.val() || 'closed');
  });
}

// ── Close room ───────────────────────────────────────────────────────────────

export async function closeRoom(roomId: string): Promise<void> {
  const db = getFirebaseDB();
  const statusRef = ref(db, `rooms/${roomId}/status`);
  await set(statusRef, 'closed');
}

// ── Get live URL for QR code ─────────────────────────────────────────────────

export function getRoomURL(roomId: string): string {
  const base = window.location.origin + import.meta.env.BASE_URL;
  return `${base}#join/${roomId}`;
}

export function getSessionURL(sessionId: string): string {
  const base = window.location.origin + import.meta.env.BASE_URL;
  return `${base}#session/${sessionId}`;
}
