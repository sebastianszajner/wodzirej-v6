import { useState, useEffect, useRef } from 'react';
import {
  joinSession,
  registerParticipant,
  onSessionStatus,
  onQuizQuestion,
  submitQuizAnswer,
  onQuizScores,
  type QuizQuestion,
} from '../../lib/room';

interface Props {
  sessionId: string;
}

type Phase = 'loading' | 'register' | 'lobby' | 'quiz' | 'closed' | 'error';

export function SessionJoinView({ sessionId }: Props) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);

  // Quiz state
  const [currentQ, setCurrentQ] = useState<(QuizQuestion & { startedAt: number }) | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [myScore, setMyScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check session on mount
  useEffect(() => {
    (async () => {
      try {
        const result = await joinSession(sessionId);
        if (!result.ok) {
          setPhase('error');
          setError(result.reason);
          return;
        }
        setPhase('register');
      } catch {
        setPhase('error');
        setError('Nie udało się połączyć z sesją');
      }
    })();
  }, [sessionId]);

  // Listen for session close
  useEffect(() => {
    const unsub = onSessionStatus(sessionId, (status) => {
      if (status === 'closed') setPhase('closed');
    });
    return () => unsub();
  }, [sessionId]);

  // Listen for quiz questions after registration
  useEffect(() => {
    if (!participantId) return;
    const unsub = onQuizQuestion(sessionId, (q) => {
      if (q) {
        setCurrentQ(q);
        setSelectedAnswer(null);
        setAnswered(false);
        setTimeLeft(q.timeLimit);
        setPhase('quiz');
      } else {
        if (phase === 'quiz') setPhase('lobby');
        setCurrentQ(null);
      }
    });
    return () => unsub();
  }, [sessionId, participantId, phase]);

  // Listen for scores
  useEffect(() => {
    if (!participantId) return;
    const unsub = onQuizScores(sessionId, (scores) => {
      setMyScore(scores[participantId] || 0);
    });
    return () => unsub();
  }, [sessionId, participantId]);

  // Quiz countdown
  useEffect(() => {
    if (phase !== 'quiz' || !currentQ || answered) return;
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          // Time's up — auto-submit wrong
          if (!answered && participantId && currentQ) {
            setAnswered(true);
            submitQuizAnswer(sessionId, currentQ.id, participantId, -1, currentQ.timeLimit * 1000, false).catch(() => {});
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, currentQ, answered, participantId, sessionId]);

  const handleRegister = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2 || registering) return;
    setRegistering(true);
    try {
      const result = await registerParticipant(sessionId, trimmed);
      if (result.ok && result.participantId) {
        setParticipantId(result.participantId);
        setPhase('lobby');
      } else {
        setError(result.reason || 'Błąd rejestracji');
        setPhase('error');
      }
    } catch {
      setError('Nie udało się dołączyć');
      setPhase('error');
    } finally {
      setRegistering(false);
    }
  };

  const handleAnswer = async (index: number) => {
    if (answered || !currentQ || !participantId) return;
    setSelectedAnswer(index);
    setAnswered(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const timeMs = (currentQ.timeLimit - timeLeft) * 1000;
    const correct = index === currentQ.correctIndex;

    try {
      await submitQuizAnswer(sessionId, currentQ.id, participantId, index, timeMs, correct);
    } catch { /* retry not needed — trainer sees results */ }
  };

  const ANSWER_COLORS = ['#e91e63', '#2196f3', '#ff9800', '#4caf50'];
  const ANSWER_SHAPES = ['▲', '◆', '●', '■'];

  return (
    <div className="sj-container">
      <style>{SJ_STYLES}</style>

      <div className="sj-brand">🎡 Wodzirej</div>

      {phase === 'loading' && (
        <div className="sj-center">
          <div className="sj-spinner" />
          <p>Łączenie z sesją...</p>
        </div>
      )}

      {phase === 'error' && (
        <div className="sj-center">
          <div className="sj-icon">❌</div>
          <p className="sj-error-text">{error}</p>
        </div>
      )}

      {phase === 'closed' && (
        <div className="sj-center">
          <div className="sj-icon">🏁</div>
          <p className="sj-big">Sesja zakończona</p>
          {myScore > 0 && <p className="sj-score-final">Twój wynik: {myScore} pkt</p>}
          <p className="sj-hint">Dziękujemy za udział!</p>
        </div>
      )}

      {phase === 'register' && (
        <div className="sj-register">
          <div className="sj-icon">👋</div>
          <p className="sj-big">Dołącz do sesji</p>
          <p className="sj-hint">Wpisz swoje imię (i nazwisko)</p>
          <div className="sj-input-row">
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
              placeholder="Twoje imię..."
              maxLength={40}
              autoFocus
              className="sj-input"
              disabled={registering}
            />
            <button
              className="sj-btn"
              onClick={handleRegister}
              disabled={name.trim().length < 2 || registering}
            >
              {registering ? '...' : 'Dołącz'}
            </button>
          </div>
        </div>
      )}

      {phase === 'lobby' && (
        <div className="sj-center">
          <div className="sj-icon">✅</div>
          <p className="sj-big">Jesteś w grze!</p>
          <p className="sj-name-display">{name}</p>
          {myScore > 0 && <p className="sj-score-badge">{myScore} pkt</p>}
          <p className="sj-hint">Czekaj na kolejne pytanie...</p>
          <div className="sj-lobby-pulse" />
        </div>
      )}

      {phase === 'quiz' && currentQ && (
        <div className="sj-quiz">
          <div className="sj-quiz-timer">
            <div className="sj-timer-bar">
              <div
                className="sj-timer-fill"
                style={{ width: `${(timeLeft / currentQ.timeLimit) * 100}%` }}
              />
            </div>
            <span className="sj-timer-num">{timeLeft}s</span>
          </div>

          <div className="sj-quiz-question">{currentQ.text}</div>

          <div className="sj-quiz-options">
            {currentQ.options.map((opt, i) => {
              let cls = 'sj-option';
              if (answered) {
                if (i === currentQ.correctIndex) cls += ' correct';
                else if (i === selectedAnswer && i !== currentQ.correctIndex) cls += ' wrong';
                else cls += ' dimmed';
              }
              return (
                <button
                  key={i}
                  className={cls}
                  style={{ '--opt-color': ANSWER_COLORS[i] } as React.CSSProperties}
                  onClick={() => handleAnswer(i)}
                  disabled={answered}
                >
                  <span className="sj-option-shape">{ANSWER_SHAPES[i]}</span>
                  <span className="sj-option-text">{opt}</span>
                </button>
              );
            })}
          </div>

          {answered && (
            <div className={`sj-answer-feedback ${selectedAnswer === currentQ.correctIndex ? 'correct' : 'wrong'}`}>
              {selectedAnswer === currentQ.correctIndex ? '✅ Dobrze!' : '❌ Źle!'}
            </div>
          )}
        </div>
      )}

      <div className="sj-room-code">Sesja: {sessionId}</div>
    </div>
  );
}

const SJ_STYLES = `
.sj-container {
  min-height: 100dvh;
  background: #0f0f13;
  color: #f0f0f5;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 20px;
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
}
.sj-brand {
  font-size: 16px;
  font-weight: 700;
  color: #e91e63;
  margin-bottom: 24px;
}
.sj-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-align: center;
}
.sj-icon { font-size: 48px; }
.sj-big { font-size: 22px; font-weight: 700; }
.sj-hint { font-size: 14px; color: #888; }
.sj-spinner {
  width: 36px; height: 36px;
  border: 3px solid rgba(255,255,255,0.1);
  border-top-color: #e91e63;
  border-radius: 50%;
  animation: sj-spin 0.8s linear infinite;
}
@keyframes sj-spin { to { transform: rotate(360deg); } }
.sj-error-text { font-size: 18px; font-weight: 600; color: #f44336; }

.sj-register {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  max-width: 400px;
}
.sj-input-row {
  display: flex;
  gap: 8px;
  width: 100%;
}
.sj-input {
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
.sj-input:focus { border-color: #e91e63; }
.sj-btn {
  padding: 14px 24px;
  background: #e91e63;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}
.sj-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.sj-name-display {
  font-size: 28px;
  font-weight: 800;
  color: #e91e63;
  margin: 8px 0;
}
.sj-score-badge {
  padding: 8px 24px;
  border-radius: 20px;
  background: rgba(255,234,9,0.15);
  color: #ffea09;
  font-size: 18px;
  font-weight: 700;
}
.sj-score-final {
  font-size: 20px;
  font-weight: 700;
  color: #ffea09;
}
.sj-lobby-pulse {
  width: 12px; height: 12px;
  border-radius: 50%;
  background: #4caf50;
  animation: sj-pulse 1.5s ease-in-out infinite;
  margin-top: 12px;
}
@keyframes sj-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(1.5); }
}

/* Quiz */
.sj-quiz {
  flex: 1;
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.sj-quiz-timer {
  display: flex;
  align-items: center;
  gap: 10px;
}
.sj-timer-bar {
  flex: 1;
  height: 8px;
  border-radius: 4px;
  background: rgba(255,255,255,0.1);
  overflow: hidden;
}
.sj-timer-fill {
  height: 100%;
  border-radius: 4px;
  background: #e91e63;
  transition: width 1s linear;
}
.sj-timer-num {
  font-size: 18px;
  font-weight: 700;
  color: #e91e63;
  min-width: 40px;
  text-align: right;
}
.sj-quiz-question {
  font-size: 20px;
  font-weight: 700;
  text-align: center;
  padding: 20px;
  background: #1c1c24;
  border-radius: 14px;
  line-height: 1.4;
}
.sj-quiz-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.sj-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px;
  border-radius: 12px;
  background: var(--opt-color);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  border: 3px solid transparent;
  transition: all 0.15s;
  text-align: left;
}
.sj-option:not(:disabled):hover {
  opacity: 0.9;
  transform: scale(1.02);
}
.sj-option:disabled { cursor: default; }
.sj-option.correct { border-color: #4caf50; box-shadow: 0 0 20px rgba(76,175,80,0.4); }
.sj-option.wrong { border-color: #f44336; opacity: 0.6; }
.sj-option.dimmed { opacity: 0.4; }
.sj-option-shape { font-size: 20px; }
.sj-option-text { flex: 1; }

.sj-answer-feedback {
  text-align: center;
  font-size: 24px;
  font-weight: 800;
  padding: 16px;
  border-radius: 12px;
  animation: sj-pop 0.3s ease-out;
}
.sj-answer-feedback.correct { background: rgba(76,175,80,0.15); color: #4caf50; }
.sj-answer-feedback.wrong { background: rgba(244,67,54,0.15); color: #f44336; }
@keyframes sj-pop { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }

.sj-room-code {
  margin-top: auto;
  padding-top: 20px;
  font-size: 12px;
  color: #555;
  letter-spacing: 1px;
}

@media (max-width: 400px) {
  .sj-quiz-options { grid-template-columns: 1fr; }
}
`;
