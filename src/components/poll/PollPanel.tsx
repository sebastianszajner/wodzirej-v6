import { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '../../store';
import { logActivity } from '../../lib/activityLog';
import { FullscreenButton } from '../ui/FullscreenButton';

interface PollOption {
  id: number;
  label: string;
  votes: number;
}

interface CompletedPoll {
  id: number;
  question: string;
  options: PollOption[];
  totalVotes: number;
  timestamp: number;
}

type PollPhase = 'create' | 'vote' | 'results';

let nextOptionId = 1;
let nextPollId = 1;

// Bar color palette
const barColors = ['#e91e63', '#2196f3', '#4caf50', '#ff9800', '#9c27b0', '#00bcd4'];

export function PollPanel() {
  const panelRef = useRef<HTMLDivElement>(null);
  const participants = useStore((s) => s.participants);

  // Create phase
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<PollOption[]>([
    { id: nextOptionId++, label: '', votes: 0 },
    { id: nextOptionId++, label: '', votes: 0 },
  ]);

  // Active poll
  const [phase, setPhase] = useState<PollPhase>('create');
  const [activeQuestion, setActiveQuestion] = useState('');
  const [activeOptions, setActiveOptions] = useState<PollOption[]>([]);
  const [showPerParticipant, setShowPerParticipant] = useState(false);
  const [participantVotes, setParticipantVotes] = useState<Record<string, number>>({}); // participantId → optionId

  // History
  const [history, setHistory] = useState<CompletedPoll[]>([]);

  // Fullscreen projector view
  const [projectorView, setProjectorView] = useState(false);
  const closeProjector = useCallback(() => setProjectorView(false), []);
  useEffect(() => {
    if (!projectorView) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') closeProjector(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [projectorView, closeProjector]);

  // ── Create phase helpers ──

  const addOption = () => {
    if (options.length >= 6) return;
    setOptions([...options, { id: nextOptionId++, label: '', votes: 0 }]);
  };

  const removeOption = (id: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((o) => o.id !== id));
  };

  const updateOptionLabel = (id: number, label: string) => {
    setOptions(options.map((o) => (o.id === id ? { ...o, label } : o)));
  };

  const canStartPoll = question.trim().length > 0 && options.filter((o) => o.label.trim()).length >= 2;

  const startPoll = () => {
    if (!canStartPoll) return;
    const cleanOptions = options
      .filter((o) => o.label.trim())
      .map((o) => ({ ...o, label: o.label.trim(), votes: 0 }));
    setActiveQuestion(question.trim());
    setActiveOptions(cleanOptions);
    setParticipantVotes({});
    setPhase('vote');
  };

  // ── Vote phase helpers ──

  const addVote = (optionId: number) => {
    setActiveOptions((prev) =>
      prev.map((o) => (o.id === optionId ? { ...o, votes: o.votes + 1 } : o))
    );
  };

  const removeVote = (optionId: number) => {
    setActiveOptions((prev) =>
      prev.map((o) => (o.id === optionId ? { ...o, votes: Math.max(0, o.votes - 1) } : o))
    );
  };

  const voteForParticipant = (participantId: string, optionId: number) => {
    const prevOptionId = participantVotes[participantId];
    if (prevOptionId === optionId) {
      // Toggle off
      const next = { ...participantVotes };
      delete next[participantId];
      setParticipantVotes(next);
      removeVote(optionId);
    } else {
      // Switch vote
      if (prevOptionId !== undefined) {
        removeVote(prevOptionId);
      }
      setParticipantVotes({ ...participantVotes, [participantId]: optionId });
      addVote(optionId);
      const optLabel = activeOptions.find((o) => o.id === optionId)?.label || '';
      logActivity({ participantId, panel: 'poll', action: 'voted', data: { optionLabel: optLabel } });
    }
  };

  const totalVotes = activeOptions.reduce((sum, o) => sum + o.votes, 0);

  const showResults = () => setPhase('results');

  const savePollAndNew = () => {
    setHistory([
      {
        id: nextPollId++,
        question: activeQuestion,
        options: activeOptions,
        totalVotes,
        timestamp: Date.now(),
      },
      ...history,
    ]);
    // Reset create form
    setQuestion('');
    const freshId1 = nextOptionId++;
    const freshId2 = nextOptionId++;
    setOptions([
      { id: freshId1, label: '', votes: 0 },
      { id: freshId2, label: '', votes: 0 },
    ]);
    setPhase('create');
  };

  const backToVoting = () => setPhase('vote');

  // ── Render ──

  // Fullscreen projector overlay
  if (projectorView && (phase === 'vote' || phase === 'results')) {
    const maxV = Math.max(...activeOptions.map(o => o.votes), 1);
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'var(--bg)', color: 'var(--txt-main)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '40px 20px', overflow: 'auto',
      }}>
        <button
          onClick={() => setProjectorView(false)}
          style={{
            position: 'absolute', top: 20, right: 28,
            background: 'none', border: 'none', color: 'var(--txt-muted)',
            fontSize: '2rem', cursor: 'pointer', lineHeight: 1,
          }}
          title="Zamknij (Esc)"
        >
          ✕
        </button>
        <div style={{ fontSize: '1.3rem', color: 'var(--txt-muted)', marginBottom: 12, letterSpacing: 1 }}>
          📊 GŁOSOWANIE
        </div>
        <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 32, textAlign: 'center', maxWidth: 800 }}>
          {activeQuestion}
        </div>
        <div style={{ width: '100%', maxWidth: 800 }}>
          {activeOptions.map((opt, i) => {
            const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
            const barW = totalVotes > 0 ? Math.round((opt.votes / maxV) * 100) : 0;
            const isWinner = opt.votes === maxV && opt.votes > 0;
            return (
              <div key={opt.id} style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '14px 0',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>
                <span style={{
                  fontSize: '1.5rem', fontWeight: 700, minWidth: 180,
                  color: isWinner ? barColors[i % barColors.length] : 'var(--txt-main)',
                }}>
                  {opt.label}
                </span>
                <div style={{
                  flex: 1, height: 32, background: 'rgba(255,255,255,0.06)',
                  borderRadius: 8, overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${barW}%`, height: '100%',
                    background: barColors[i % barColors.length],
                    borderRadius: 8,
                    transition: 'width 0.6s ease',
                  }} />
                </div>
                <span style={{
                  fontSize: '2rem', fontWeight: 900, minWidth: 80, textAlign: 'right',
                  color: barColors[i % barColors.length],
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {opt.votes}
                </span>
                <span style={{
                  fontSize: '1.1rem', color: 'var(--txt-muted)', minWidth: 60,
                }}>
                  ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 24, fontSize: '1.2rem', color: 'var(--txt-muted)' }}>
          Łącznie: <strong>{totalVotes}</strong> głosów
        </div>
        {phase === 'vote' && (
          <div style={{ marginTop: 16, fontSize: '0.9rem', color: 'var(--txt-muted)', opacity: 0.6 }}>
            Wyniki aktualizują się na żywo
          </div>
        )}
      </div>
    );
  }

  if (phase === 'create') {
    return (
      <div className="panel poll-panel" ref={panelRef} style={{ overflow: 'auto', padding: '16px', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <FullscreenButton targetRef={panelRef} />
        </div>
        <div className="poll-section">
          <div className="poll-section-title">Nowe głosowanie</div>

          <div className="poll-field">
            <label className="poll-label">Pytanie</label>
            <input
              className="poll-input"
              placeholder="Wpisz pytanie..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={200}
            />
          </div>

          <div className="poll-field">
            <label className="poll-label">Opcje ({options.length}/6)</label>
            {options.map((opt, i) => (
              <div key={opt.id} className="poll-option-row">
                <span className="poll-option-num">{i + 1}.</span>
                <input
                  className="poll-input"
                  placeholder={`Opcja ${i + 1}`}
                  value={opt.label}
                  onChange={(e) => updateOptionLabel(opt.id, e.target.value)}
                  maxLength={100}
                />
                {options.length > 2 && (
                  <button
                    className="btn poll-remove-opt"
                    onClick={() => removeOption(opt.id)}
                    title="Usuń opcję"
                  >
                    &times;
                  </button>
                )}
              </div>
            ))}
            {options.length < 6 && (
              <button className="btn poll-add-opt" onClick={addOption}>
                + Dodaj opcję
              </button>
            )}
          </div>

          <button className="btn primary" onClick={startPoll} disabled={!canStartPoll}>
            Rozpocznij głosowanie
          </button>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="poll-section poll-history">
            <div className="poll-section-title">Historia ({history.length})</div>
            {history.map((poll) => (
              <div key={poll.id} className="poll-history-card">
                <div className="poll-history-q">{poll.question}</div>
                <div className="poll-history-results">
                  {poll.options.map((opt, i) => {
                    const pct = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
                    return (
                      <div key={opt.id} className="poll-bar-row">
                        <span className="poll-bar-label">{opt.label}</span>
                        <div className="poll-bar-track">
                          <div
                            className="poll-bar-fill"
                            style={{
                              width: `${pct}%`,
                              background: barColors[i % barColors.length],
                            }}
                          />
                        </div>
                        <span className="poll-bar-pct">{opt.votes} ({pct}%)</span>
                      </div>
                    );
                  })}
                </div>
                <div className="poll-history-meta">
                  {poll.totalVotes} głosów &middot;{' '}
                  {new Date(poll.timestamp).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (phase === 'vote') {
    return (
      <div className="panel poll-panel" ref={panelRef} style={{ overflow: 'auto', padding: '16px', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <FullscreenButton targetRef={panelRef} />
        </div>
        <div className="poll-section">
          <div className="poll-active-question">{activeQuestion}</div>

          {/* Manual voting mode */}
          <div className="poll-vote-grid">
            {activeOptions.map((opt, i) => (
              <div key={opt.id} className="poll-vote-card">
                <button
                  className="btn poll-vote-btn"
                  style={{ borderColor: barColors[i % barColors.length] }}
                  onClick={() => addVote(opt.id)}
                >
                  <span className="poll-vote-label">{opt.label}</span>
                  <span
                    className="poll-vote-count"
                    style={{ color: barColors[i % barColors.length] }}
                  >
                    {opt.votes}
                  </span>
                </button>
                {opt.votes > 0 && (
                  <button
                    className="btn poll-vote-minus"
                    onClick={() => removeVote(opt.id)}
                    title="Cofnij głos"
                  >
                    -1
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="poll-total-row">
            Łącznie: <strong>{totalVotes}</strong> głosów
          </div>

          {/* Per-participant voting toggle */}
          {participants.length > 0 && (
            <div className="poll-per-participant">
              <button
                className={`btn${showPerParticipant ? ' active' : ''}`}
                onClick={() => setShowPerParticipant(!showPerParticipant)}
              >
                {showPerParticipant ? 'Ukryj uczestników' : 'Głosowanie imienne'}
              </button>

              {showPerParticipant && (
                <div className="poll-participant-grid">
                  {participants.map((p) => (
                    <div key={p.id} className="poll-participant-row">
                      <span className="poll-participant-name">{p.text}</span>
                      <div className="poll-participant-opts">
                        {activeOptions.map((opt, i) => (
                          <button
                            key={opt.id}
                            className={`btn poll-p-opt-btn${participantVotes[p.id] === opt.id ? ' voted' : ''}`}
                            style={
                              participantVotes[p.id] === opt.id
                                ? { background: barColors[i % barColors.length], color: '#fff', borderColor: barColors[i % barColors.length] }
                                : { borderColor: barColors[i % barColors.length] }
                            }
                            onClick={() => voteForParticipant(p.id, opt.id)}
                            title={opt.label}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="poll-vote-actions">
            <button className="btn primary" onClick={showResults}>
              Pokaż wyniki
            </button>
            <button className="btn" onClick={() => setProjectorView(true)} title="Widok dla projektora">
              ⛶ Projektor
            </button>
          </div>
        </div>
      </div>
    );
  }

  // phase === 'results'
  const maxVotes = Math.max(...activeOptions.map((o) => o.votes), 1);

  return (
    <div className="panel poll-panel" ref={panelRef} style={{ overflow: 'auto', padding: '16px', flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <FullscreenButton targetRef={panelRef} />
      </div>
      <div className="poll-section">
        <div className="poll-active-question">{activeQuestion}</div>

        <div className="poll-results-chart">
          {activeOptions.map((opt, i) => {
            const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
            const barW = totalVotes > 0 ? Math.round((opt.votes / maxVotes) * 100) : 0;
            const isWinner = opt.votes === maxVotes && opt.votes > 0;
            return (
              <div key={opt.id} className={`poll-result-row${isWinner ? ' winner' : ''}`}>
                <span className="poll-result-label">{opt.label}</span>
                <div className="poll-bar-track">
                  <div
                    className="poll-bar-fill"
                    style={{
                      width: `${barW}%`,
                      background: barColors[i % barColors.length],
                    }}
                  />
                </div>
                <span className="poll-result-num">
                  {opt.votes} <span className="poll-result-pct">({pct}%)</span>
                </span>
              </div>
            );
          })}
        </div>

        <div className="poll-total-row">
          Łącznie: <strong>{totalVotes}</strong> głosów
        </div>

        <div className="poll-results-actions">
          <button className="btn" onClick={backToVoting}>
            Wróć do głosowania
          </button>
          <button className="btn" onClick={() => setProjectorView(true)} title="Widok dla projektora">
            ⛶ Projektor
          </button>
          <button className="btn primary" onClick={savePollAndNew}>
            Zapisz i nowe
          </button>
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="poll-section poll-history">
          <div className="poll-section-title">Historia ({history.length})</div>
          {history.map((poll) => (
            <div key={poll.id} className="poll-history-card">
              <div className="poll-history-q">{poll.question}</div>
              <div className="poll-history-results">
                {poll.options.map((opt, j) => {
                  const pct = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
                  return (
                    <div key={opt.id} className="poll-bar-row">
                      <span className="poll-bar-label">{opt.label}</span>
                      <div className="poll-bar-track">
                        <div
                          className="poll-bar-fill"
                          style={{
                            width: `${pct}%`,
                            background: barColors[j % barColors.length],
                          }}
                        />
                      </div>
                      <span className="poll-bar-pct">{opt.votes} ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
              <div className="poll-history-meta">
                {poll.totalVotes} głosów &middot;{' '}
                {new Date(poll.timestamp).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
