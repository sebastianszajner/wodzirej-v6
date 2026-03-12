import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { isFirebaseConfigured } from '../../lib/firebase';
import { createRoom, closeRoom, onWordsChange, type WordEntry } from '../../lib/room';
import { LiveOverlay } from './LiveOverlay';

// ── Palette & helpers ────────────────────────────────────────────────────────
const PALETTE = [
  '#e91e63', '#ffea09', '#4caf50', '#2196f3', '#ff9800',
  '#9c27b0', '#00bcd4', '#ff5722', '#8bc34a', '#e040fb',
];

const ROTATIONS = ['0deg', '-12deg', '12deg', '0deg', '-8deg', '8deg'];

let _wcId = 0;
const wcId = () => `wc-${++_wcId}`;

type Mode = 'local' | 'live';

// ── Session persistence ──────────────────────────────────────────────────────
const SESSION_KEY = 'wodzirej-live-room';

function getSavedSession(): { roomId: string; question: string } | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveSession(roomId: string, question: string) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ roomId, question }));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// ── Component ────────────────────────────────────────────────────────────────
export function WordCloudPanel() {
  const saved = getSavedSession();

  // Local mode state
  const [localWords, setLocalWords] = useState<WordEntry[]>([]);
  const [input, setInput] = useState('');
  const [question, setQuestion] = useState(saved?.question || '');
  const inputRef = useRef<HTMLInputElement>(null);

  // Mode & live state — restore from localStorage if active
  const [mode, setMode] = useState<Mode>(saved ? 'live' : 'local');
  const [roomId, setRoomId] = useState<string | null>(saved?.roomId || null);
  const [liveWords, setLiveWords] = useState<WordEntry[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);

  const firebaseOk = isFirebaseConfigured();

  // Cleanup Firebase listener on unmount or mode change
  useEffect(() => {
    if (mode !== 'live' || !roomId) return;

    const unsub = onWordsChange(roomId, (entries) => {
      setLiveWords(entries);
    });

    return () => unsub();
  }, [mode, roomId]);

  // Focus input on mount
  useEffect(() => { inputRef.current?.focus(); }, []);

  // Current words depend on mode
  const words = mode === 'live' ? liveWords : localWords;

  // ── Local mode handlers ──

  const addWord = useCallback(() => {
    const w = input.trim().toLowerCase();
    if (!w) return;
    setLocalWords((prev) => {
      const existing = prev.find((e) => e.word === w);
      if (existing) {
        return prev.map((e) => e.word === w ? { ...e, count: e.count + 1 } : e);
      }
      return [...prev, { id: wcId(), word: w, count: 1 }];
    });
    setInput('');
  }, [input]);

  const increment = useCallback((id: string) => {
    if (mode === 'live') return; // no local edits in live mode
    setLocalWords((prev) => prev.map((e) => e.id === id ? { ...e, count: e.count + 1 } : e));
  }, [mode]);

  const remove = useCallback((id: string) => {
    if (mode === 'live') return;
    setLocalWords((prev) => prev.filter((e) => e.id !== id));
  }, [mode]);

  const reset = useCallback(() => {
    if (words.length > 0 && confirm('Wyczyścić chmurę słów?')) {
      setLocalWords([]);
      setQuestion('');
    }
  }, [words.length]);

  // ── Live mode handlers ──

  const startLive = async () => {
    if (!question.trim()) {
      setLiveError('Wpisz pytanie przed rozpoczęciem sesji live');
      return;
    }
    setLiveLoading(true);
    setLiveError(null);
    try {
      const code = await createRoom(question.trim());
      setRoomId(code);
      setMode('live');
      setLiveWords([]);
      saveSession(code, question.trim());
    } catch (err) {
      setLiveError(err instanceof Error ? err.message : 'Błąd połączenia z Firebase');
    } finally {
      setLiveLoading(false);
    }
  };

  const stopLive = async () => {
    if (roomId) {
      try { await closeRoom(roomId); } catch { /* ignore */ }
    }
    clearSession();
    // Keep words visible but switch to viewing mode
    setLocalWords(liveWords.map((w) => ({ ...w, id: wcId() })));
    setMode('local');
    setRoomId(null);
    setLiveWords([]);
  };

  // ── Derived ──

  const maxCount = useMemo(() => Math.max(1, ...words.map((w) => w.count)), [words]);
  const sorted = useMemo(() => [...words].sort((a, b) => b.count - a.count), [words]);

  return (
    <div className="panel wordcloud-panel" style={{ overflow: 'auto', padding: '16px', flex: 1 }}>
      <style>{wordcloudCSS}</style>

      {/* Mode toggle */}
      {firebaseOk && (
        <div className="wc-mode-toggle">
          <button
            className={`wc-mode-btn ${mode === 'local' ? 'active' : ''}`}
            onClick={() => { if (mode === 'live') stopLive(); }}
            disabled={mode === 'local'}
          >
            ✏️ Lokalnie
          </button>
          <button
            className={`wc-mode-btn wc-mode-live ${mode === 'live' ? 'active' : ''}`}
            onClick={() => { if (mode === 'local') startLive(); }}
            disabled={mode === 'live' || liveLoading}
          >
            {liveLoading ? '⏳ Łączenie...' : '📡 Live (QR)'}
          </button>
        </div>
      )}

      {liveError && (
        <div className="wc-live-error">{liveError}</div>
      )}

      {/* Live overlay with QR code */}
      {mode === 'live' && roomId && (
        <LiveOverlay
          roomId={roomId}
          wordCount={liveWords.length}
          onClose={stopLive}
        />
      )}

      {/* Question prompt — only in local mode or before live starts */}
      {mode === 'local' && (
        <>
          <div className="wc-question-row">
            <input
              className="wc-question-input"
              placeholder="Pytanie: np. Czym jest dla Was przywództwo?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>
          {question && <div className="wc-question-display">{question}</div>}
        </>
      )}

      {/* Question display in live mode */}
      {mode === 'live' && question && (
        <div className="wc-question-display">{question}</div>
      )}

      {/* Input row — only in local mode */}
      {mode === 'local' && (
        <div className="wc-input-row">
          <input
            ref={inputRef}
            className="wc-word-input"
            placeholder="Wpisz słowo..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addWord(); }}
          />
          <button className="btn primary" onClick={addWord} disabled={!input.trim()}>
            Dodaj
          </button>
          <button className="btn danger" onClick={reset} disabled={words.length === 0}>
            Reset
          </button>
        </div>
      )}

      <div className="wc-body">
        {/* Cloud display */}
        <div className="wc-cloud-area">
          {words.length === 0 ? (
            <div className="wc-empty">
              <span className="wc-empty-icon">☁️</span>
              <p>{mode === 'live' ? 'Czekam na odpowiedzi uczestników...' : 'Dodaj słowa, aby zobaczyć chmurę'}</p>
            </div>
          ) : (
            <div className="wc-cloud">
              {words.map((entry, i) => {
                const ratio = entry.count / maxCount;
                const size = 14 + ratio * 48;
                const color = PALETTE[i % PALETTE.length];
                const rotation = ROTATIONS[i % ROTATIONS.length];
                return (
                  <span
                    key={entry.id}
                    className="wc-word"
                    style={{
                      fontSize: `${size}px`,
                      color,
                      transform: `rotate(${rotation})`,
                      animationDelay: `${i * 40}ms`,
                    }}
                    title={`${entry.word}: ${entry.count}×`}
                    onClick={() => increment(entry.id)}
                  >
                    {entry.word}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar word list */}
        {words.length > 0 && (
          <div className="wc-sidebar">
            <div className="wc-sidebar-title">Słowa ({words.length})</div>
            <div className="wc-word-list">
              {sorted.map((entry) => (
                <div key={entry.id} className="wc-word-item">
                  <span
                    className="wc-word-text"
                    onClick={() => increment(entry.id)}
                    title={mode === 'local' ? 'Kliknij, aby dodać +1' : undefined}
                  >
                    {entry.word}
                  </span>
                  <span className="wc-word-count">{entry.count}×</span>
                  {mode === 'local' && (
                    <button className="wc-word-remove" onClick={() => remove(entry.id)} title="Usuń">
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── CSS ──────────────────────────────────────────────────────────────────────
const wordcloudCSS = `
.wordcloud-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Mode toggle */
.wc-mode-toggle {
  display: flex;
  gap: 4px;
  background: var(--input-bg);
  border-radius: 10px;
  padding: 3px;
  width: fit-content;
}
.wc-mode-btn {
  padding: 6px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--txt-muted);
  background: transparent;
  transition: all 0.15s;
  cursor: pointer;
}
.wc-mode-btn.active {
  background: var(--panel-bg);
  color: var(--txt-main);
  box-shadow: 0 1px 4px rgba(0,0,0,0.3);
}
.wc-mode-btn:not(.active):hover {
  color: var(--txt-main);
}
.wc-mode-live.active {
  color: #f44336;
}
.wc-live-error {
  padding: 8px 12px;
  background: rgba(244, 67, 54, 0.12);
  color: #f44336;
  border-radius: 8px;
  font-size: 13px;
}

.wc-question-row {
  display: flex;
}
.wc-question-input {
  flex: 1;
  padding: 8px 14px;
  background: var(--input-bg);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  color: var(--txt-main);
  font-size: 13px;
}
.wc-question-input::placeholder { color: var(--txt-muted); }
.wc-question-display {
  text-align: center;
  font-size: 18px;
  font-weight: 700;
  color: var(--accent2);
  padding: 8px 0 0;
}

.wc-input-row {
  display: flex;
  gap: 8px;
}
.wc-word-input {
  flex: 1;
  padding: 8px 14px;
  background: var(--input-bg);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  color: var(--txt-main);
  font-size: 14px;
}
.wc-word-input::placeholder { color: var(--txt-muted); }

.wc-body {
  display: flex;
  gap: 12px;
  flex: 1;
  min-height: 0;
}

.wc-cloud-area {
  flex: 1;
  min-height: 200px;
  background: var(--input-bg);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.wc-empty {
  text-align: center;
  color: var(--txt-muted);
}
.wc-empty-icon { font-size: 48px; display: block; margin-bottom: 8px; }

.wc-cloud {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 10px 16px;
  padding: 24px;
  max-height: 100%;
  overflow: auto;
}
.wc-word {
  display: inline-block;
  font-weight: 700;
  cursor: pointer;
  transition: transform .15s, opacity .15s;
  user-select: none;
  animation: wc-pop .3s ease-out both;
  line-height: 1.2;
}
.wc-word:hover {
  opacity: .7;
  transform: scale(1.12) !important;
}

@keyframes wc-pop {
  from { opacity: 0; transform: scale(0.3); }
  to   { opacity: 1; }
}

.wc-sidebar {
  width: 180px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.wc-sidebar-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--txt-muted);
  text-transform: uppercase;
  letter-spacing: .5px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--line);
}
.wc-word-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
  flex: 1;
}
.wc-word-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 8px;
  background: var(--input-bg);
}
.wc-word-text {
  flex: 1;
  font-size: 13px;
  cursor: pointer;
  color: var(--txt-main);
}
.wc-word-text:hover { color: var(--accent); }
.wc-word-count {
  font-size: 11px;
  color: var(--txt-muted);
  font-weight: 600;
  min-width: 24px;
  text-align: right;
}
.wc-word-remove {
  background: none;
  border: none;
  color: var(--txt-muted);
  font-size: 11px;
  padding: 2px 4px;
  border-radius: 4px;
  cursor: pointer;
}
.wc-word-remove:hover { color: var(--accent); background: rgba(233,30,99,.15); }

@media (max-width: 700px) {
  .wc-body { flex-direction: column; }
  .wc-sidebar { width: 100%; max-height: 150px; }
}
`;
