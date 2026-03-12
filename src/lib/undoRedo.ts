interface UndoAction {
  description: string;
  undo: () => void;
  redo: () => void;
}

const undoStack: UndoAction[] = [];
const redoStack: UndoAction[] = [];
const MAX_STACK = 30;
const listeners: (() => void)[] = [];

export function pushUndo(action: UndoAction) {
  undoStack.push(action);
  if (undoStack.length > MAX_STACK) undoStack.shift();
  redoStack.length = 0;
  notify();
}

export function undo() {
  const action = undoStack.pop();
  if (!action) return;
  action.undo();
  redoStack.push(action);
  notify();
}

export function redo() {
  const action = redoStack.pop();
  if (!action) return;
  action.redo();
  undoStack.push(action);
  notify();
}

export function canUndo() { return undoStack.length > 0; }
export function canRedo() { return redoStack.length > 0; }
export function lastUndoDesc() { return undoStack[undoStack.length - 1]?.description ?? ''; }

export function subscribe(fn: () => void) {
  listeners.push(fn);
  return () => {
    const i = listeners.indexOf(fn);
    if (i >= 0) listeners.splice(i, 1);
  };
}

function notify() { listeners.forEach(fn => fn()); }
