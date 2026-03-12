export interface Participant {
  id: string;
  first: string;
  last: string;
  text: string; // computed displayName
}

export interface Group {
  id: string;
  index: number;
  color: string;   // group colour (hex)
  members: Participant[];
}

export type WheelMode = 'pick' | 'pickRemove';
export type GroupMode = 'bySize' | 'byCount';

export interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

// ── Scoring ──────────────────────────────────────────────────────────────────
export interface ScoreAction {
  id: string;
  label: string;
  points: number;
  emoji: string;
}

export interface ScoreEntry {
  id: string;
  participantId: string;
  actionId: string;
  points: number;
  timestamp: number;
}

// ── Tabs ─────────────────────────────────────────────────────────────────────
export const CORE_TABS = ['participants', 'groups', 'wheel', 'score'] as const;
export const EXTRA_TABS = [
  'timer', 'poll', 'icebreaker', 'parking',
  'energy', 'noise', 'wordcloud', 'retro',
  'queue', 'agenda', 'kahoot', 'report',
] as const;
export const ALL_TABS = [...CORE_TABS, ...EXTRA_TABS, 'about'] as const;

export type CoreTab = typeof CORE_TABS[number];
export type ExtraTab = typeof EXTRA_TABS[number];
export type Tab = typeof ALL_TABS[number];

export const TAB_META: Record<ExtraTab, { emoji: string; label: string; shortLabel: string; desc: string }> = {
  timer:      { emoji: '⏱️', label: 'Timer',       shortLabel: 'Timer',   desc: 'Countdown, stoper, breakout timer' },
  poll:       { emoji: '📊', label: 'Głosowanie',  shortLabel: 'Ankieta', desc: 'Szybkie ankiety i głosowania' },
  icebreaker: { emoji: '🧊', label: 'Lodołamacz',  shortLabel: 'Lód',     desc: 'Losowe pytania na rozgrzewkę' },
  parking:    { emoji: '🅿️', label: 'Parking',      shortLabel: 'Parking', desc: 'Pytania i tematy "na później"' },
  energy:     { emoji: '🔋', label: 'Energia',      shortLabel: 'Energia', desc: 'Pulse-check energii grupy' },
  noise:      { emoji: '🔊', label: 'Hałas',        shortLabel: 'Hałas',   desc: 'Miernik poziomu dźwięku' },
  wordcloud:  { emoji: '☁️', label: 'Chmura słów',  shortLabel: 'Chmura',  desc: 'Generuj word cloud z haseł grupy' },
  retro:      { emoji: '🔄', label: 'Retro',        shortLabel: 'Retro',   desc: 'Start / Stop / Continue' },
  queue:      { emoji: '🎤', label: 'Kolejka',      shortLabel: 'Kolejka', desc: 'Kolejka mówców z timerem' },
  agenda:     { emoji: '📋', label: 'Agenda',       shortLabel: 'Agenda',  desc: 'Timeline dnia z progress bar' },
  kahoot:     { emoji: '🧠', label: 'Quiz',         shortLabel: 'Quiz',    desc: 'Kahoot-style quiz z punktami' },
  report:     { emoji: '📈', label: 'Raport',       shortLabel: 'Raport',  desc: 'Aktywności uczestników i raporty' },
};

// ── Parking Lot ──────────────────────────────────────────────────────────────
export interface ParkingItem {
  id: string;
  title: string;
  status: 'parked' | 'discussed' | 'rejected';
  createdAt: number;
}

// ── Energy Check ─────────────────────────────────────────────────────────────
export interface EnergyCheck {
  id: string;
  label: string;
  ratings: Record<string, number>; // participantId → 1-5
  timestamp: number;
}

// ── Retro ────────────────────────────────────────────────────────────────────
export type RetroFormat = 'ssc' | 'gsm' | '4l';
export interface RetroCard {
  id: string;
  column: string;
  text: string;
  votes: number;
}

// ── Queue ────────────────────────────────────────────────────────────────────
export interface QueueEntry {
  participantId: string;
  spoke: boolean;
  duration: number; // seconds spent speaking
}

// ── Agenda ───────────────────────────────────────────────────────────────────
export interface AgendaBlock {
  id: string;
  title: string;
  duration: number; // minutes
  status: 'pending' | 'active' | 'done';
  elapsed: number;  // seconds elapsed
}

export interface AppState {
  // Participants
  participants: Participant[];
  addParticipants: (list: Omit<Participant, 'id'>[]) => void;
  removeParticipant: (id: string) => void;
  clearParticipants: () => void;

  // Groups
  groups: Group[];
  previousGroups: Group[];
  groupMode: GroupMode;
  groupSize: number;
  groupCount: number;
  setGroupMode: (m: GroupMode) => void;
  setGroupSize: (n: number) => void;
  setGroupCount: (n: number) => void;
  generateGroups: (neverTogether?: [string, string][]) => void;

  // Wheel
  wheelMode: WheelMode;
  wheelPool: Participant[]; // current spin pool (for pickRemove)
  wheelGroupId: string | 'all'; // selected group filter for wheel
  wheelShowAll: boolean;        // show all or only unspoken
  setWheelMode: (m: WheelMode) => void;
  setWheelGroupId: (id: string | 'all') => void;
  setWheelShowAll: (v: boolean) => void;
  resetWheelPool: () => void;
  removeFromPool: (id: string) => void;

  // Spoke tracking (per-session, manual reset)
  spokeIds: string[];
  markSpoke: (id: string) => void;
  unmarkSpoke: (id: string) => void;
  resetSpoke: () => void;

  // Scoring
  scores: Record<string, number>;     // participantId → total points
  scoreLog: ScoreEntry[];
  scoreActions: ScoreAction[];
  addScore: (participantId: string, actionId: string) => void;
  removeLastScore: (participantId: string) => void;
  resetScores: () => void;
  updateScoreAction: (actionId: string, points: number) => void;

  // UI
  activeTab: Tab;
  setActiveTab: (t: Tab) => void;
  toasts: Toast[];
  showToast: (msg: string, type?: Toast['type']) => void;
  dismissToast: (id: string) => void;
}
