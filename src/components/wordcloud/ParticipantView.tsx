import { useState, useEffect, useRef } from 'react';
import { joinRoom, submitWord, onRoomStatus } from '../../lib/room';

interface Props {
  roomId: string;
}

export function ParticipantView({ roomId }: Props) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'closed' | 'error'>('loading');
  const [question, setQuestion] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [word, setWord] = useState('');
  const [sent, setSent] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Join room on mount
  useEffect(() => {
    let unsub: (() => void) | null = null;

    (async () => {
      try {
        const result = await joinRoom(roomId);
        if (!result.ok) {
          setStatus('error');
          setErrorMsg(result.reason);
          return;
        }
        setQuestion(result.question);
        setStatus('ready');

        // Listen for room closure
        unsub = onRoomStatus(roomId, (s) => {
          if (s === 'closed') setStatus('closed');
        });
      } catch {
        setStatus('error');
        setErrorMsg('Nie udało się połączyć z sesją');
      }
    })();

    return () => { unsub?.(); };
  }, [roomId]);

  const handleSubmit = async () => {
    const trimmed = word.trim();
    if (!trimmed || sending) return;

    setSending(true);
    try {
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000));
      await Promise.race([submitWord(roomId, trimmed), timeout]);
      setSent((prev) => [trimmed, ...prev]);
      setWord('');
      inputRef.current?.focus();
    } catch {
      // Show brief error feedback
      setWord(trimmed);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="pv-container">
      <style>{PV_STYLES}</style>

      <div className="pv-brand">🎡 Wodzirej</div>

      {status === 'loading' && (
        <div className="pv-center">
          <div className="pv-spinner" />
          <p>Łączenie z sesją...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="pv-center">
          <div className="pv-icon">❌</div>
          <p className="pv-error-text">{errorMsg}</p>
          <p className="pv-hint">Sprawdź kod pokoju i spróbuj ponownie</p>
        </div>
      )}

      {status === 'closed' && (
        <div className="pv-center">
          <div className="pv-icon">🏁</div>
          <p className="pv-closed-text">Sesja została zakończona</p>
          <p className="pv-hint">Dziękujemy za udział!</p>
          {sent.length > 0 && (
            <div className="pv-sent-summary">
              Wysłano {sent.length} {sent.length === 1 ? 'słowo' : sent.length < 5 ? 'słowa' : 'słów'}
            </div>
          )}
        </div>
      )}

      {status === 'ready' && (
        <>
          <div className="pv-question">{question}</div>

          <div className="pv-input-row">
            <input
              ref={inputRef}
              type="text"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Wpisz słowo..."
              maxLength={40}
              autoFocus
              className="pv-input"
              disabled={sending}
            />
            <button
              className="pv-send-btn"
              onClick={handleSubmit}
              disabled={!word.trim() || sending}
            >
              {sending ? '...' : 'Wyślij'}
            </button>
          </div>

          {sent.length > 0 && (
            <div className="pv-sent-list">
              <div className="pv-sent-title">Twoje odpowiedzi ({sent.length})</div>
              <div className="pv-sent-chips">
                {sent.map((w, i) => (
                  <span key={i} className="pv-sent-chip">✓ {w}</span>
                ))}
              </div>
            </div>
          )}

          <div className="pv-room-code">Pokój: {roomId}</div>
        </>
      )}
    </div>
  );
}

// ── Mobile-first styles ──────────────────────────────────────────────────────

const PV_STYLES = `
.pv-container {
  min-height: 100dvh;
  background: #0f0f13;
  color: #f0f0f5;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 20px;
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
}
.pv-brand {
  font-size: 16px;
  font-weight: 700;
  color: #e91e63;
  margin-bottom: 24px;
}
.pv-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-align: center;
}
.pv-icon { font-size: 48px; }
.pv-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(255,255,255,0.1);
  border-top-color: #e91e63;
  border-radius: 50%;
  animation: pv-spin 0.8s linear infinite;
}
@keyframes pv-spin { to { transform: rotate(360deg); } }
.pv-error-text { font-size: 18px; font-weight: 600; color: #f44336; }
.pv-closed-text { font-size: 18px; font-weight: 600; }
.pv-hint { font-size: 14px; color: #888; }
.pv-sent-summary {
  margin-top: 8px;
  padding: 8px 16px;
  border-radius: 10px;
  background: rgba(76, 175, 80, 0.15);
  color: #4caf50;
  font-size: 14px;
  font-weight: 600;
}
.pv-question {
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 24px;
  padding: 16px;
  background: #1c1c24;
  border-radius: 14px;
  width: 100%;
  max-width: 400px;
  line-height: 1.4;
}
.pv-input-row {
  display: flex;
  gap: 8px;
  width: 100%;
  max-width: 400px;
  margin-bottom: 20px;
}
.pv-input {
  flex: 1;
  padding: 14px 16px;
  background: #1c1c24;
  border: 2px solid rgba(255,255,255,0.09);
  border-radius: 12px;
  color: #f0f0f5;
  font-size: 16px;
  outline: none;
  transition: border-color 0.2s;
}
.pv-input:focus {
  border-color: #e91e63;
}
.pv-send-btn {
  padding: 14px 24px;
  background: #e91e63;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s;
  white-space: nowrap;
}
.pv-send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.pv-send-btn:not(:disabled):hover {
  opacity: 0.85;
}
.pv-sent-list {
  width: 100%;
  max-width: 400px;
}
.pv-sent-title {
  font-size: 12px;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}
.pv-sent-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.pv-sent-chip {
  padding: 4px 12px;
  border-radius: 20px;
  background: rgba(76, 175, 80, 0.12);
  color: #4caf50;
  font-size: 13px;
  font-weight: 500;
}
.pv-room-code {
  margin-top: auto;
  padding-top: 20px;
  font-size: 12px;
  color: #555;
  letter-spacing: 1px;
}
`;
