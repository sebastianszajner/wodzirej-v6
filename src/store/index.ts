import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { AppState, Participant, Group, GroupMode, WheelMode, Toast } from './types';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
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
    }));
    get().resetWheelPool();
  },

  clearParticipants: () => {
    set({ participants: [], groups: [], wheelPool: [] });
    get().showToast('Lista wyczyszczona');
  },

  // ── Groups ───────────────────────────────────────────────
  groups: [],
  groupMode: 'bySize',
  groupSize: 4,
  groupCount: 3,

  setGroupMode: (m: GroupMode) => set({ groupMode: m }),
  setGroupSize: (n: number) => set({ groupSize: Math.max(2, Math.min(15, n)) }),
  setGroupCount: (n: number) => set({ groupCount: Math.max(2, Math.min(15, n)) }),

  generateGroups: () => {
    const { participants, groupMode, groupSize, groupCount } = get();
    if (participants.length < 2) {
      get().showToast('Dodaj min. 2 uczestników', 'error');
      return;
    }
    const shuffled = shuffle(participants);
    let groups: Group[] = [];

    if (groupMode === 'byCount') {
      const n = Math.min(groupCount, shuffled.length);
      groups = Array.from({ length: n }, (_, i) => ({
        id: nanoid(),
        index: i + 1,
        members: [] as Participant[],
      }));
      shuffled.forEach((p, i) => groups[i % n].members.push(p));
    } else {
      for (let i = 0; i < shuffled.length; i += groupSize) {
        groups.push({
          id: nanoid(),
          index: groups.length + 1,
          members: shuffled.slice(i, i + groupSize),
        });
      }
    }

    set({ groups });
    get().showToast(`Grupy: ${groups.length} × ~${Math.ceil(shuffled.length / groups.length)} os.`, 'success');
  },

  // ── Wheel ────────────────────────────────────────────────
  wheelMode: 'pick',
  wheelPool: [],

  setWheelMode: (m: WheelMode) => set({ wheelMode: m }),

  resetWheelPool: () => set((s) => ({ wheelPool: [...s.participants] })),

  removeFromPool: (id: string) =>
    set((s) => ({ wheelPool: s.wheelPool.filter((p) => p.id !== id) })),

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
