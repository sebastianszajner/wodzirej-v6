export interface Participant {
  id: string;
  first: string;
  last: string;
  text: string; // computed displayName
}

export interface Group {
  id: string;
  index: number;
  members: Participant[];
}

export type WheelMode = 'pick' | 'pickRemove';
export type GroupMode = 'bySize' | 'byCount';

export interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

export interface AppState {
  // Participants
  participants: Participant[];
  addParticipants: (list: Omit<Participant, 'id'>[]) => void;
  removeParticipant: (id: string) => void;
  clearParticipants: () => void;

  // Groups
  groups: Group[];
  groupMode: GroupMode;
  groupSize: number;
  groupCount: number;
  setGroupMode: (m: GroupMode) => void;
  setGroupSize: (n: number) => void;
  setGroupCount: (n: number) => void;
  generateGroups: () => void;

  // Wheel
  wheelMode: WheelMode;
  wheelPool: Participant[]; // current spin pool (for pickRemove)
  setWheelMode: (m: WheelMode) => void;
  resetWheelPool: () => void;
  removeFromPool: (id: string) => void;

  // UI
  activeTab: 'participants' | 'groups' | 'wheel';
  setActiveTab: (t: AppState['activeTab']) => void;
  toasts: Toast[];
  showToast: (msg: string, type?: Toast['type']) => void;
  dismissToast: (id: string) => void;
}
