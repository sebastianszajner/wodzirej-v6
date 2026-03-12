import { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store';
import { isFirebaseConfigured } from '../../lib/firebase';
import { QRCodeSVG } from 'qrcode.react';
import {
  createSession,
  closeSession,
  getSessionURL,
  onSessionParticipants,
  publishQuizQuestion,
  clearQuizQuestion,
  onQuizAnswers,
  updateQuizScores,
} from '../../lib/room';
import { logActivity } from '../../lib/activityLog';
import { nanoid } from 'nanoid';

// ── Types ────────────────────────────────────────────────────────────────────

interface LocalQuestion {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  timeLimit: number;
}

type Phase = 'setup' | 'lobby' | 'playing' | 'question' | 'results' | 'leaderboard' | 'final';

const DEFAULT_TIME = 20;
const ANSWER_COLORS = ['#e91e63', '#2196f3', '#ff9800', '#4caf50'];
const ANSWER_SHAPES = ['▲', '◆', '●', '■'];

// ── Session persistence ──────────────────────────────────────────────────────

const SESSION_KEY = 'wodzirej-kahoot-session';

function getSavedSession(): { sessionId: string } | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveSessionData(sessionId: string) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ sessionId }));
}

function clearSessionData() {
  localStorage.removeItem(SESSION_KEY);
}

// ── Component ────────────────────────────────────────────────────────────────

export function KahootPanel() {
  const participants = useStore((s) => s.participants);
  const addScore = useStore((s) => s.addScore);
  const showToast = useStore((s) => s.showToast);
  const firebaseOk = isFirebaseConfigured();

  const saved = getSavedSession();

  // Session
  const [sessionId, setSessionId] = useState<string | null>(saved?.sessionId || null);
  const [remoteParticipants, setRemoteParticipants] = useState<Array<{ id: string; name: string }>>([]);
  const [phase, setPhase] = useState<Phase>(saved ? 'lobby' : 'setup');

  // Questions
  const [questions, setQuestions] = useState<LocalQuestion[]>([]);
  const [editQ, setEditQ] = useState<LocalQuestion>({
    id: '', text: '', options: ['', '', '', ''], correctIndex: 0, timeLimit: DEFAULT_TIME,
  });

  // Play state
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { answerIndex: number; timeMs: number; correct: boolean }>>({});
  const [quizScores, setQuizScores] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Listen to remote participants
  useEffect(() => {
    if (!sessionId) return;
    const unsub = onSessionParticipants(sessionId, setRemoteParticipants);
    return () => unsub();
  }, [sessionId]);

  // ── Session management ─────────────────────────────────────────────────────

  const startSession = async () => {
    try {
      const id = await createSession();
      setSessionId(id);
      saveSessionData(id);
      setPhase('lobby');
      showToast('Sesja live utworzona — uczestnicy mogą dołączać', 'success');
    } catch (err) {
      showToast('Błąd tworzenia sesji', 'error');
    }
  };

  const endSession = async () => {
    if (sessionId) {
      try { await closeSession(sessionId); } catch {}
    }
    clearSessionData();
    setSessionId(null);
    setPhase('setup');
    setRemoteParticipants([]);
    setQuizScores({});
    setCurrentIdx(0);
  };

  // ── Question editing ───────────────────────────────────────────────────────

  const addQuestion = () => {
    if (!editQ.text.trim() || editQ.options.filter((o) => o.trim()).length < 2) {
      showToast('Wpisz pytanie i min. 2 odpowiedzi', 'error');
      return;
    }
    const q: LocalQuestion = {
      ...editQ,
      id: nanoid(8),
      options: editQ.options.filter((o) => o.trim()),
      correctIndex: Math.min(editQ.correctIndex, editQ.options.filter((o) => o.trim()).length - 1),
    };
    setQuestions((prev) => [...prev, q]);
    setEditQ({ id: '', text: '', options: ['', '', '', ''], correctIndex: 0, timeLimit: DEFAULT_TIME });
  };

  const removeQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  // ── Quiz play ──────────────────────────────────────────────────────────────

  const startQuiz = () => {
    if (questions.length === 0) {
      showToast('Dodaj przynajmniej 1 pytanie', 'error');
      return;
    }
    setCurrentIdx(0);
    setQuizScores({});
    setPhase('playing');
    showQuestion(0);
  };

  const showQuestion = async (idx: number) => {
    if (!sessionId || idx >= questions.length) return;
    const q = questions[idx];
    setAnswers({});
    setTimeLeft(q.timeLimit);
    setPhase('question');

    await publishQuizQuestion(sessionId, q);

    // Start countdown
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Listen to answers for current question
  useEffect(() => {
    if (!sessionId || phase !== 'question') return;
    const q = questions[currentIdx];
    if (!q) return;

    const unsub = onQuizAnswers(sessionId, q.id, (ans) => {
      setAnswers(ans);
    });
    return () => unsub();
  }, [sessionId, phase, currentIdx, questions]);

  const showResults = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (sessionId) await clearQuizQuestion(sessionId);
    setPhase('results');
  };

  const showLeaderboard = async () => {
    // Calculate scores for this question
    const q = questions[currentIdx];
    const newScores = { ...quizScores };
    for (const [pid, ans] of Object.entries(answers)) {
      if (ans.correct) {
        // Score = base 1000 - time penalty (faster = more points)
        const timeBonus = Math.max(0, Math.round(1000 * (1 - ans.timeMs / (q.timeLimit * 1000))));
        const points = 500 + timeBonus;
        newScores[pid] = (newScores[pid] || 0) + points;
      }
    }
    setQuizScores(newScores);
    if (sessionId) await updateQuizScores(sessionId, newScores);
    setPhase('leaderboard');
  };

  const nextQuestion = () => {
    const next = currentIdx + 1;
    if (next >= questions.length) {
      setPhase('final');
      return;
    }
    setCurrentIdx(next);
    showQuestion(next);
  };

  const syncToWodzirejScores = () => {
    // Map firebase participant IDs to local participants by name matching
    let synced = 0;
    for (const rp of remoteParticipants) {
      const score = quizScores[rp.id];
      if (!score) continue;
      // Find matching local participant by first name
      const local = participants.find(
        (p) => p.first.toLowerCase() === rp.name.split(' ')[0].toLowerCase()
          || p.text.toLowerCase() === rp.name.toLowerCase()
      );
      if (local) {
        // Add score as "quiz" action (find or use 'inne')
        const quizPoints = Math.round(score / 100); // Scale down: 1500 quiz pts → 15 wodzirej pts
        if (quizPoints > 0) {
          for (let i = 0; i < quizPoints; i++) addScore(local.id, 'inne');
          synced++;
        }
      }
    }
    // Log quiz completion for synced participants
    for (const rp of remoteParticipants) {
      const score = quizScores[rp.id];
      if (!score) continue;
      const local = participants.find(
        (p) => p.first.toLowerCase() === rp.name.split(' ')[0].toLowerCase()
          || p.text.toLowerCase() === rp.name.toLowerCase()
      );
      if (local) {
        logActivity({ participantId: local.id, panel: 'kahoot', action: 'quiz_completed', data: { score } });
      }
    }
    showToast(synced > 0 ? `Zsynchronizowano ${synced} wyników z Rankingiem` : 'Brak pasujących uczestników (sprawdź imiona)', synced > 0 ? 'success' : 'error');
  };

  // ── Render helpers ─────────────────────────────────────────────────────────

  const currentQ = questions[currentIdx];
  const totalAnswered = Object.keys(answers).length;
  const totalParticipants = remoteParticipants.length;
  const correctCount = Object.values(answers).filter((a) => a.correct).length;

  // Leaderboard sorted
  const leaderboard = [...remoteParticipants]
    .map((p) => ({ ...p, score: quizScores[p.id] || 0 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  if (!firebaseOk) {
    return (
      <div className="panel" style={{ padding: 24, textAlign: 'center', color: 'var(--txt-muted)' }}>
        <p style={{ fontSize: 48 }}>🧠</p>
        <p style={{ marginTop: 12 }}>Quiz wymaga Firebase. Skonfiguruj VITE_FIREBASE_DATABASE_URL w .env.local</p>
      </div>
    );
  }

  return (
    <div className="panel kahoot-panel" style={{ overflow: 'auto', padding: '16px', flex: 1 }}>
      <style>{KAHOOT_CSS}</style>

      {/* ── SETUP: Create questions ── */}
      {phase === 'setup' && (
        <div className="kh-setup">
          <div className="kh-section-title">🧠 Quiz — Przygotuj pytania</div>

          {/* Question editor */}
          <div className="kh-editor">
            <input
              className="kh-q-input"
              placeholder="Wpisz pytanie..."
              value={editQ.text}
              onChange={(e) => setEditQ({ ...editQ, text: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && addQuestion()}
            />
            <div className="kh-options-grid">
              {editQ.options.map((opt, i) => (
                <div key={i} className="kh-option-edit" style={{ '--opt-color': ANSWER_COLORS[i] } as React.CSSProperties}>
                  <span className="kh-opt-shape">{ANSWER_SHAPES[i]}</span>
                  <input
                    placeholder={`Odpowiedź ${i + 1}${i >= 2 ? ' (opcja)' : ''}`}
                    value={opt}
                    onChange={(e) => {
                      const opts = [...editQ.options];
                      opts[i] = e.target.value;
                      setEditQ({ ...editQ, options: opts });
                    }}
                  />
                  <label className="kh-correct-check" title="Oznacz jako poprawną">
                    <input
                      type="radio"
                      name="correct"
                      checked={editQ.correctIndex === i}
                      onChange={() => setEditQ({ ...editQ, correctIndex: i })}
                    />
                    ✓
                  </label>
                </div>
              ))}
            </div>
            <div className="kh-editor-bottom">
              <label className="kh-time-label">
                Czas:
                <select
                  value={editQ.timeLimit}
                  onChange={(e) => setEditQ({ ...editQ, timeLimit: Number(e.target.value) })}
                >
                  {[10, 15, 20, 30, 45, 60].map((s) => (
                    <option key={s} value={s}>{s}s</option>
                  ))}
                </select>
              </label>
              <button className="btn primary" onClick={addQuestion}>+ Dodaj pytanie</button>
            </div>
          </div>

          {/* Question list */}
          {questions.length > 0 && (
            <div className="kh-q-list">
              <div className="kh-q-list-title">Pytania ({questions.length})</div>
              {questions.map((q, i) => (
                <div key={q.id} className="kh-q-item">
                  <span className="kh-q-num">{i + 1}.</span>
                  <span className="kh-q-text">{q.text}</span>
                  <span className="kh-q-meta">{q.timeLimit}s · {q.options.length} odp.</span>
                  <button className="kh-q-del" onClick={() => removeQuestion(q.id)}>✕</button>
                </div>
              ))}
            </div>
          )}

          <div className="kh-setup-actions">
            <button
              className="btn primary"
              onClick={startSession}
              disabled={questions.length === 0}
            >
              📡 Rozpocznij sesję live
            </button>
          </div>
        </div>
      )}

      {/* ── LOBBY: QR + waiting for participants ── */}
      {phase === 'lobby' && sessionId && (
        <div className="kh-lobby">
          <div className="kh-live-badge">
            <span className="kh-live-dot" />
            LIVE — Sesja quiz
          </div>

          <div className="kh-qr-section">
            <div className="kh-qr-card">
              <QRCodeSVG
                value={getSessionURL(sessionId)}
                size={200}
                bgColor="#ffffff"
                fgColor="#0f0f13"
                level="M"
                includeMargin
              />
            </div>
            <div className="kh-qr-info">
              <p className="kh-qr-instruction">Zeskanuj QR telefonem, aby dołączyć</p>
              <p className="kh-qr-code">Kod: <strong>{sessionId}</strong></p>
              <p className="kh-qr-url">{getSessionURL(sessionId)}</p>
            </div>
          </div>

          <div className="kh-participants-list">
            <div className="kh-p-title">Uczestnicy ({remoteParticipants.length})</div>
            <div className="kh-p-chips">
              {remoteParticipants.map((p) => (
                <span key={p.id} className="kh-p-chip">{p.name}</span>
              ))}
              {remoteParticipants.length === 0 && (
                <span className="kh-p-empty">Czekam na uczestników...</span>
              )}
            </div>
          </div>

          <div className="kh-lobby-actions">
            <button
              className="btn primary"
              onClick={startQuiz}
              disabled={remoteParticipants.length === 0 || questions.length === 0}
            >
              🚀 Start quiz ({questions.length} pytań)
            </button>
            <button className="btn danger" onClick={endSession}>Zakończ sesję</button>
          </div>
        </div>
      )}

      {/* ── QUESTION: Live question display ── */}
      {phase === 'question' && currentQ && (
        <div className="kh-question-view">
          <div className="kh-q-header">
            <span className="kh-q-counter">Pytanie {currentIdx + 1}/{questions.length}</span>
            <span className="kh-q-timer" style={{ color: timeLeft <= 5 ? '#f44336' : '#ffea09' }}>
              {timeLeft}s
            </span>
            <span className="kh-q-answered">{totalAnswered}/{totalParticipants} odpowiedzi</span>
          </div>

          <div className="kh-timer-bar">
            <div
              className="kh-timer-fill"
              style={{ width: `${(timeLeft / currentQ.timeLimit) * 100}%` }}
            />
          </div>

          <div className="kh-q-display">{currentQ.text}</div>

          <div className="kh-options-display">
            {currentQ.options.map((opt, i) => (
              <div
                key={i}
                className="kh-opt-box"
                style={{ background: ANSWER_COLORS[i] }}
              >
                <span className="kh-opt-shape-lg">{ANSWER_SHAPES[i]}</span>
                <span>{opt}</span>
              </div>
            ))}
          </div>

          <button className="btn primary kh-show-results" onClick={showResults}>
            Pokaż wyniki
          </button>
        </div>
      )}

      {/* ── RESULTS: Answer distribution ── */}
      {phase === 'results' && currentQ && (
        <div className="kh-results-view">
          <div className="kh-q-header">
            <span className="kh-q-counter">Pytanie {currentIdx + 1}/{questions.length}</span>
            <span className="kh-result-stat">
              ✅ {correctCount}/{totalAnswered} poprawnych
            </span>
          </div>

          <div className="kh-q-display">{currentQ.text}</div>

          <div className="kh-results-bars">
            {currentQ.options.map((opt, i) => {
              const count = Object.values(answers).filter((a) => a.answerIndex === i).length;
              const pct = totalAnswered > 0 ? (count / totalAnswered) * 100 : 0;
              const isCorrect = i === currentQ.correctIndex;
              return (
                <div key={i} className={`kh-result-bar ${isCorrect ? 'correct' : ''}`}>
                  <div className="kh-rb-label">
                    <span style={{ color: ANSWER_COLORS[i] }}>{ANSWER_SHAPES[i]}</span>
                    <span>{opt}</span>
                    {isCorrect && <span className="kh-rb-check">✓</span>}
                  </div>
                  <div className="kh-rb-track">
                    <div
                      className="kh-rb-fill"
                      style={{ width: `${pct}%`, background: ANSWER_COLORS[i] }}
                    />
                    <span className="kh-rb-count">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <button className="btn primary" onClick={showLeaderboard}>
            📊 Pokaż ranking
          </button>
        </div>
      )}

      {/* ── LEADERBOARD: Top scores ── */}
      {(phase === 'leaderboard' || phase === 'final') && (
        <div className="kh-leaderboard-view">
          <div className="kh-lb-title">
            {phase === 'final' ? '🏆 Wyniki końcowe' : `📊 Ranking po pytaniu ${currentIdx + 1}`}
          </div>

          <div className="kh-lb-list">
            {leaderboard.map((p, i) => (
              <div key={p.id} className={`kh-lb-row ${i < 3 ? 'top' : ''}`}>
                <span className="kh-lb-rank">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                </span>
                <span className="kh-lb-name">{p.name}</span>
                <span className="kh-lb-score">{p.score} pkt</span>
              </div>
            ))}
            {leaderboard.length === 0 && (
              <p style={{ textAlign: 'center', color: 'var(--txt-muted)' }}>Brak wyników</p>
            )}
          </div>

          <div className="kh-lb-actions">
            {phase === 'leaderboard' && (
              <button className="btn primary" onClick={nextQuestion}>
                {currentIdx + 1 < questions.length ? `Następne pytanie (${currentIdx + 2}/${questions.length})` : '🏆 Pokaż wyniki końcowe'}
              </button>
            )}
            {phase === 'final' && participants.length > 0 && (
              <button className="btn primary" onClick={syncToWodzirejScores}>
                🏆 Dodaj punkty do Rankingu Wodzireja
              </button>
            )}
            <button className="btn danger" onClick={endSession}>
              Zakończ quiz
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const KAHOOT_CSS = `
.kahoot-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Setup */
.kh-section-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 12px;
}
.kh-editor {
  background: var(--panel-bg);
  border-radius: var(--radius);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.kh-q-input {
  padding: 10px 14px;
  background: var(--input-bg);
  border: 1px solid var(--line);
  border-radius: 10px;
  color: var(--txt-main);
  font-size: 15px;
  font-weight: 600;
}
.kh-q-input::placeholder { color: var(--txt-muted); }
.kh-options-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.kh-option-edit {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--opt-color) 15%, var(--input-bg));
  border: 1px solid color-mix(in srgb, var(--opt-color) 30%, transparent);
}
.kh-opt-shape {
  font-size: 16px;
  color: var(--opt-color);
  width: 24px;
  text-align: center;
  flex-shrink: 0;
}
.kh-option-edit input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--txt-main);
  font-size: 13px;
  outline: none;
}
.kh-option-edit input::placeholder { color: var(--txt-muted); }
.kh-correct-check {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 14px;
  cursor: pointer;
  color: var(--txt-muted);
}
.kh-correct-check:has(input:checked) {
  color: #4caf50;
  font-weight: 700;
}
.kh-correct-check input { width: 14px; height: 14px; cursor: pointer; }
.kh-editor-bottom {
  display: flex;
  align-items: center;
  gap: 12px;
}
.kh-time-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--txt-muted);
}
.kh-time-label select {
  background: var(--input-bg);
  border: 1px solid var(--line);
  color: var(--txt-main);
  border-radius: 6px;
  padding: 4px 8px;
}

/* Question list */
.kh-q-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.kh-q-list-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--txt-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 8px 0 4px;
}
.kh-q-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--panel-bg);
  border-radius: 8px;
}
.kh-q-num { color: var(--txt-muted); font-size: 12px; min-width: 20px; }
.kh-q-text { flex: 1; font-size: 13px; }
.kh-q-meta { font-size: 11px; color: var(--txt-muted); }
.kh-q-del {
  background: none;
  color: var(--txt-muted);
  font-size: 14px;
  padding: 2px 6px;
  border-radius: 4px;
  cursor: pointer;
}
.kh-q-del:hover { color: #f44336; background: rgba(244,67,54,0.1); }

.kh-setup-actions {
  padding-top: 12px;
}

/* Lobby */
.kh-lobby {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.kh-live-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  border-radius: 20px;
  background: rgba(244,67,54,0.12);
  color: #f44336;
  font-weight: 700;
  font-size: 14px;
  width: fit-content;
}
.kh-live-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  background: #f44336;
  animation: kh-pulse 1.5s ease-in-out infinite;
}
@keyframes kh-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

.kh-qr-section {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
  justify-content: center;
  padding: 20px;
  background: var(--panel-bg);
  border-radius: var(--radius);
}
.kh-qr-card {
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
}
.kh-qr-info { display: flex; flex-direction: column; gap: 6px; }
.kh-qr-instruction { font-size: 16px; font-weight: 700; }
.kh-qr-code { font-size: 14px; color: var(--txt-muted); }
.kh-qr-code strong { color: var(--txt-main); font-size: 18px; letter-spacing: 2px; }
.kh-qr-url {
  font-size: 11px;
  color: var(--accent);
  font-family: monospace;
  background: var(--input-bg);
  padding: 6px 10px;
  border-radius: 8px;
  word-break: break-all;
  max-width: 320px;
}

.kh-participants-list {
  padding: 16px;
  background: var(--panel-bg);
  border-radius: var(--radius);
}
.kh-p-title {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 10px;
}
.kh-p-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.kh-p-chip {
  padding: 6px 14px;
  border-radius: 20px;
  background: rgba(233,30,99,0.12);
  color: #e91e63;
  font-size: 13px;
  font-weight: 600;
  animation: kh-pop 0.3s ease-out;
}
@keyframes kh-pop { from { transform: scale(0.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.kh-p-empty { color: var(--txt-muted); font-size: 13px; }
.kh-lobby-actions {
  display: flex;
  gap: 10px;
}

/* Question view */
.kh-question-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.kh-q-header {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 14px;
}
.kh-q-counter { font-weight: 700; }
.kh-q-timer { font-size: 28px; font-weight: 800; }
.kh-q-answered { margin-left: auto; color: var(--txt-muted); }
.kh-timer-bar {
  height: 6px;
  border-radius: 3px;
  background: rgba(255,255,255,0.08);
  overflow: hidden;
}
.kh-timer-fill {
  height: 100%;
  border-radius: 3px;
  background: #ffea09;
  transition: width 1s linear;
}
.kh-q-display {
  font-size: 24px;
  font-weight: 700;
  text-align: center;
  padding: 32px 24px;
  background: var(--panel-bg);
  border-radius: var(--radius);
  line-height: 1.4;
}
.kh-options-display {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.kh-opt-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  border-radius: 12px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
}
.kh-opt-shape-lg { font-size: 24px; }
.kh-show-results { align-self: center; }

/* Results */
.kh-results-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.kh-result-stat { color: #4caf50; font-weight: 700; }
.kh-results-bars {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.kh-result-bar {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.kh-result-bar.correct {
  background: rgba(76,175,80,0.08);
  border-radius: 10px;
  padding: 8px;
}
.kh-rb-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
}
.kh-rb-check { color: #4caf50; }
.kh-rb-track {
  height: 28px;
  border-radius: 6px;
  background: rgba(255,255,255,0.06);
  position: relative;
  overflow: hidden;
}
.kh-rb-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.5s ease-out;
  min-width: 2px;
}
.kh-rb-count {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 13px;
  font-weight: 700;
  color: #fff;
}

/* Leaderboard */
.kh-leaderboard-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.kh-lb-title {
  font-size: 24px;
  font-weight: 800;
  text-align: center;
}
.kh-lb-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 500px;
  margin: 0 auto;
  width: 100%;
}
.kh-lb-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--panel-bg);
  border-radius: 10px;
  animation: kh-slide 0.3s ease-out;
}
.kh-lb-row.top { background: rgba(255,234,9,0.08); }
@keyframes kh-slide { from { transform: translateX(-20px); opacity: 0; } to { transform: none; opacity: 1; } }
.kh-lb-rank { font-size: 18px; min-width: 28px; text-align: center; }
.kh-lb-name { flex: 1; font-weight: 600; font-size: 15px; }
.kh-lb-score { font-weight: 700; color: var(--accent2); font-size: 15px; }
.kh-lb-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

@media (max-width: 600px) {
  .kh-options-grid, .kh-options-display { grid-template-columns: 1fr; }
  .kh-q-display { font-size: 18px; padding: 20px 16px; }
}
`;
