import { useState, useRef, useEffect, useCallback } from 'react';

const NOTES_KEY = 'wodzirej-trainer-notes';

function loadNotes(): string {
  try { return localStorage.getItem(NOTES_KEY) || ''; } catch { return ''; }
}

export function TrainerNotes() {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(loadNotes);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Debounced save to localStorage
  const saveNotes = useCallback((value: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      localStorage.setItem(NOTES_KEY, value);
    }, 500);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    setNotes(v);
    saveNotes(v);
  };

  // Focus textarea when panel opens
  useEffect(() => {
    if (open && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [open]);

  // Keyboard shortcut: N to toggle (when not in input)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'n' || e.key === 'N') {
        if (!e.ctrlKey && !e.altKey && !e.metaKey) {
          setOpen(v => !v);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const preview = notes.trim()
    ? `${notes.trim().slice(0, 30)}${notes.trim().length > 30 ? '...' : ''}`
    : '';
  const lineCount = notes.split('\n').length;

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen(v => !v)}
        title="Notatki trenera (N)"
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1000,
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: open ? 'var(--accent)' : 'var(--bg2)',
          color: open ? '#fff' : 'var(--txt-main)',
          border: '1px solid var(--line)',
          cursor: 'pointer',
          fontSize: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          transition: 'background 0.2s, color 0.2s',
        }}
      >
        {notes.trim() ? `\u{1F4DD}` : `\u{1F4DD}`}
      </button>

      {/* Minimized preview */}
      {!open && preview && (
        <div
          onClick={() => setOpen(true)}
          style={{
            position: 'fixed',
            bottom: 70,
            right: 20,
            zIndex: 999,
            background: 'var(--bg2)',
            border: '1px solid var(--line)',
            borderRadius: 8,
            padding: '4px 10px',
            fontSize: 11,
            color: 'var(--txt-muted)',
            cursor: 'pointer',
            maxWidth: 180,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {lineCount} linii
        </div>
      )}

      {/* Slide-out panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: open ? 0 : -320,
          width: 300,
          height: '100vh',
          zIndex: 999,
          background: 'var(--bg1)',
          borderLeft: '1px solid var(--line)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'right 0.25s ease',
          boxShadow: open ? '-4px 0 16px rgba(0,0,0,0.2)' : 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderBottom: '1px solid var(--line)',
            flexShrink: 0,
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--txt-main)' }}>
            Notatki trenera
          </span>
          <button
            onClick={() => setOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--txt-muted)',
              cursor: 'pointer',
              fontSize: 18,
              padding: '0 4px',
            }}
          >
            x
          </button>
        </div>
        <textarea
          ref={textareaRef}
          value={notes}
          onChange={handleChange}
          placeholder="Wpisz notatki... (auto-zapis)"
          style={{
            flex: 1,
            resize: 'none',
            background: 'var(--input-bg)',
            color: 'var(--txt-main)',
            border: 'none',
            padding: 14,
            fontSize: 13,
            lineHeight: 1.5,
            fontFamily: 'inherit',
            outline: 'none',
          }}
        />
        <div
          style={{
            padding: '6px 14px',
            borderTop: '1px solid var(--line)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 11,
            color: 'var(--txt-muted)',
            flexShrink: 0,
          }}
        >
          <span>{notes.length} znaków</span>
          <button
            onClick={() => { setNotes(''); localStorage.removeItem(NOTES_KEY); }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent)',
              cursor: 'pointer',
              fontSize: 11,
              padding: 0,
            }}
          >
            Wyczyść
          </button>
        </div>
      </div>
    </>
  );
}
