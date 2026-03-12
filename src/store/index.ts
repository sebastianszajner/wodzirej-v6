import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { AppState, Participant, Group, GroupMode, WheelMode, Toast, ScoreAction, ScoreEntry } from './types';
import { logActivity } from '../lib/activityLog';
import { pushUndo } from '../lib/undoRedo';

// ── Default score actions ────────────────────────────────────────────────────
export const DEFAULT_SCORE_ACTIONS: ScoreAction[] = [
  { id: 'odpowiedz',   label: 'Odpowiedź po kole',      points: 2, emoji: '🎡' },
  { id: 'scenka',      label: 'Scenka',                  points: 3, emoji: '🎭' },
  { id: 'aktywnosc',   label: 'Aktywność',               points: 2, emoji: '⚡' },
  { id: 'punktualnosc',label: 'Punktualność',            points: 1, emoji: '⏰' },
  { id: 'wystapienie', label: 'Wystąpienie za grupę',    points: 4, emoji: '🎤' },
  { id: 'inne',        label: 'Inne',                    points: 1, emoji: '✨' },
];

// Group colour palette (up to 8 groups)
export const GROUP_COLORS = [
  '#e91e63', // pink (accent)
  '#2196f3', // blue
  '#4caf50', // green
  '#ff9800', // orange
  '#9c27b0', // purple
  '#00bcd4', // cyan
  '#ff5722', // deep-orange
  '#795548', // brown
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Build set of "A|B" pair keys from groups
function buildPairSet(groups: Group[]): Set<string> {
  const pairs = new Set<string>();
  for (const g of groups) {
    for (let i = 0; i < g.members.length; i++) {
      for (let j = i + 1; j < g.members.length; j++) {
        const [a, b] = [g.members[i].id, g.members[j].id].sort();
        pairs.add(`${a}|${b}`);
      }
    }
  }
  return pairs;
}

// Count how many pairs from candidate overlap with previous
function countPairCollisions(candidate: Group[], prevPairs: Set<string>): number {
  let collisions = 0;
  for (const g of candidate) {
    for (let i = 0; i < g.members.length; i++) {
      for (let j = i + 1; j < g.members.length; j++) {
        const [a, b] = [g.members[i].id, g.members[j].id].sort();
        if (prevPairs.has(`${a}|${b}`)) collisions++;
      }
    }
  }
  return collisions;
}

// Generate groups from a shuffled array
function buildGroups(shuffled: Participant[], mode: GroupMode, size: number, count: number): Group[] {
  const groups: Group[] = [];
  if (mode === 'byCount') {
    const n = Math.min(count, shuffled.length);
    for (let i = 0; i < n; i++) {
      groups.push({ id: nanoid(), index: i + 1, color: GROUP_COLORS[i % GROUP_COLORS.length], members: [] });
    }
    shuffled.forEach((p, i) => groups[i % n].members.push(p));
  } else {
    for (let i = 0; i < shuffled.length; i += size) {
      const idx = groups.length;
      groups.push({
        id: nanoid(),
        index: idx + 1,
        color: GROUP_COLORS[idx % GROUP_COLORS.length],
        members: shuffled.slice(i, i + size),
      });
    }
  }
  return groups;
}

export const useStore = create<AppState>((set, get) => ({
  // ── Participants ──────────────────────────────────────────
  participants: [],

  addParticipants: (list) => {
    const MAX = 30;
    const existing = get().participants;
    const newOnes: Participant[] = list
      .map((p) => ({
        id: nanoid(),
        first: String(p.first || '').trim(),
        last: String(p.last || '').trim(),
        text: p.text || (p.last ? `${p.first} ${p.last}`.trim() : String(p.first || '').trim()),
      }))
      .filter((p) => p.first.length >= 2);

    const combined = [...existing, ...newOnes].slice(0, MAX);
    const dropped = existing.length + newOnes.length - combined.length;

    set({ participants: combined, groups: [] });
    get().resetWheelPool();

    const added = newOnes.length - Math.max(0, dropped);
    if (dropped > 0) {
      get().showToast(`Dodano ${added}. Limit 30 — pominięto ${dropped}.`, 'error');
    } else {
      get().showToast(`Dodano ${added} uczestników`, 'success');
    }
  },

  removeParticipant: (id) => {
    set((s) => ({
      participants: s.participants.filter((p) => p.id !== id),
      groups: [],
      spokeIds: s.spokeIds.filter((x) => x !== id),
    }));
    get().resetWheelPool();
  },

  clearParticipants: () => {
    set({ participants: [], groups: [], wheelPool: [], spokeIds: [], wheelGroupId: 'all' });
    get().showToast('Lista wyczyszczona');
  },

  // ── Groups ───────────────────────────────────────────────
  groups: [],
  previousGroups: [],
  groupMode: 'bySize',
  groupSize: 4,
  groupCount: 3,

  setGroupMode: (m: GroupMode) => set({ groupMode: m }),
  setGroupSize: (n: number) => set({ groupSize: Math.max(2, Math.min(15, n)) }),
  setGroupCount: (n: number) => set({ groupCount: Math.max(2, Math.min(15, n)) }),

  generateGroups: (neverTogether?: [string, string][]) => {
    const { participants, groupMode, groupSize, groupCount, groups: currentGroups, previousGroups: prevGroupsBeforeGen } = get();
    if (participants.length < 2) {
      get().showToast('Dodaj min. 2 uczestników', 'error');
      return;
    }

    // Save state for undo
    const savedGroups = [...currentGroups];
    const savedPrevGroups = [...prevGroupsBeforeGen];

    // Build pair set from previous round to avoid repeats
    const prevPairs = currentGroups.length > 0 ? buildPairSet(currentGroups) : new Set<string>();

    // Build constraint pair set
    const constraintPairs = new Set<string>();
    if (neverTogether) {
      for (const [a, b] of neverTogether) {
        const [x, y] = [a, b].sort();
        constraintPairs.add(`${x}|${y}`);
      }
    }

    // Try multiple shuffles and pick the one with fewest pair collisions
    const ATTEMPTS = (prevPairs.size > 0 || constraintPairs.size > 0) ? 50 : 1;
    let bestGroups: Group[] = [];
    let bestCollisions = Infinity;

    for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
      const shuffled = shuffle(participants);
      const candidate = buildGroups(shuffled, groupMode, groupSize, groupCount);
      let collisions = prevPairs.size > 0 ? countPairCollisions(candidate, prevPairs) : 0;

      // Penalty for constraint violations
      if (constraintPairs.size > 0) {
        collisions += countPairCollisions(candidate, constraintPairs) * 100;
      }

      if (collisions < bestCollisions) {
        bestCollisions = collisions;
        bestGroups = candidate;
        if (collisions === 0) break; // perfect — no repeats
      }
    }

    const groups = bestGroups;

    // Reset spoke and wheel group filter on new generation
    set({ groups, previousGroups: currentGroups, spokeIds: [], wheelGroupId: 'all' });
    get().resetWheelPool();

    const msg = `Grupy: ${groups.length} × ~${Math.ceil(participants.length / groups.length)} os.`;
    if (prevPairs.size > 0 && bestCollisions === 0) {
      get().showToast(`${msg} (0 powtórzeń)`, 'success');
    } else if (prevPairs.size > 0) {
      get().showToast(`${msg} (min. ${bestCollisions} powtórzeń par)`, 'info');
    } else {
      get().showToast(msg, 'success');
    }

    // Log group assignments per participant
    for (const g of groups) {
      for (const m of g.members) {
        logActivity({ participantId: m.id, panel: 'groups', action: 'assigned_group', data: { groupIndex: g.index, color: g.color } });
      }
    }

    // Undo support
    pushUndo({
      description: 'Generowanie grup',
      undo: () => {
        set({ groups: savedGroups, previousGroups: savedPrevGroups });
        get().resetWheelPool();
        get().showToast('Cofnięto generowanie grup', 'info');
      },
      redo: () => {
        set({ groups, previousGroups: currentGroups });
        get().resetWheelPool();
        get().showToast('Ponowiono generowanie grup', 'info');
      },
    });
  },

  // ── Wheel ────────────────────────────────────────────────
  wheelMode: 'pick',
  wheelPool: [],
  wheelGroupId: 'all',
  wheelShowAll: true,

  setWheelMode: (m: WheelMode) => set({ wheelMode: m }),
  setWheelGroupId: (id) => set({ wheelGroupId: id }),
  setWheelShowAll: (v) => set({ wheelShowAll: v }),

  resetWheelPool: () => set((s) => ({ wheelPool: [...s.participants] })),

  removeFromPool: (id: string) =>
    set((s) => ({ wheelPool: s.wheelPool.filter((p) => p.id !== id) })),

  // ── Spoke tracking (manual reset) ────────────────────────
  spokeIds: [],

  markSpoke: (id) =>
    set((s) => ({
      spokeIds: s.spokeIds.includes(id) ? s.spokeIds : [...s.spokeIds, id],
    })),

  unmarkSpoke: (id) =>
    set((s) => ({ spokeIds: s.spokeIds.filter((x) => x !== id) })),

  resetSpoke: () =>
    set((s) => ({ spokeIds: [], wheelPool: [...s.participants] })),

  // ── Scoring ──────────────────────────────────────────────
  scores: {},
  scoreLog: [],
  scoreActions: DEFAULT_SCORE_ACTIONS,

  addScore: (participantId, actionId) => {
    const action = get().scoreActions.find((a) => a.id === actionId);
    if (!action) return;
    const entry: ScoreEntry = {
      id: nanoid(),
      participantId,
      actionId,
      points: action.points,
      timestamp: Date.now(),
    };
    set((s) => ({
      scoreLog: [...s.scoreLog, entry],
      scores: {
        ...s.scores,
        [participantId]: (s.scores[participantId] || 0) + action.points,
      },
    }));
    const p = get().participants.find((x) => x.id === participantId);
    get().showToast(`${action.emoji} ${p?.first ?? ''} +${action.points} pkt`, 'success');
    logActivity({ participantId, panel: 'score', action: 'scored', data: { points: action.points, emoji: action.emoji, label: action.label } });

    // Undo support
    pushUndo({
      description: `Punkty: ${p?.first ?? ''} +${action.points}`,
      undo: () => {
        set((s) => ({
          scoreLog: s.scoreLog.filter((e) => e.id !== entry.id),
          scores: {
            ...s.scores,
            [participantId]: Math.max(0, (s.scores[participantId] || 0) - action.points),
          },
        }));
        get().showToast(`Cofnięto: ${p?.first ?? ''} -${action.points} pkt`, 'info');
      },
      redo: () => {
        set((s) => ({
          scoreLog: [...s.scoreLog, entry],
          scores: {
            ...s.scores,
            [participantId]: (s.scores[participantId] || 0) + action.points,
          },
        }));
        get().showToast(`Ponowiono: ${p?.first ?? ''} +${action.points} pkt`, 'info');
      },
    });
  },

  removeLastScore: (participantId) => {
    const log = get().scoreLog;
    const lastEntry = [...log].reverse().find((e) => e.participantId === participantId);
    if (!lastEntry) return;
    set((s) => ({
      scoreLog: s.scoreLog.filter((e) => e.id !== lastEntry.id),
      scores: {
        ...s.scores,
        [participantId]: Math.max(0, (s.scores[participantId] || 0) - lastEntry.points),
      },
    }));
  },

  resetScores: () => set({ scores: {}, scoreLog: [] }),

  updateScoreAction: (actionId, points) =>
    set((s) => ({
      scoreActions: s.scoreActions.map((a) =>
        a.id === actionId ? { ...a, points: Math.max(1, Math.min(99, points)) } : a
      ),
    })),

  // ── UI ───────────────────────────────────────────────────
  activeTab: 'wheel',

  setActiveTab: (t) => set({ activeTab: t }),

  toasts: [],
  showToast: (msg, type = 'info') => {
    const t: Toast = { id: nanoid(), message: msg, type };
    set((s) => ({ toasts: [...s.toasts.slice(-3), t] }));
    setTimeout(() => get().dismissToast(t.id), 3500);
  },
  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
