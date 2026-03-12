import { useState, useEffect, useCallback } from 'react';
import { useStore } from '../../store';
import type { Participant } from '../../store/types';

export function ScorePanel() {
  const participants    = useStore((s) => s.participants);
  const groups          = useStore((s) => s.groups);
  const scores          = useStore((s) => s.scores);
  const scoreLog        = useStore((s) => s.scoreLog);
  const scoreActions    = useStore((s) => s.scoreActions);
  const addScore        = useStore((s) => s.addScore);
  const removeLastScore = useStore((s) => s.removeLastScore);
  const resetScores     = useStore((s) => s.resetScores);
  const updateScoreAction = useStore((s) => s.updateScoreAction);

  const [fullscreen, setFullscreen] = useState(false);

  const closeFullscreen = useCallback(() => setFullscreen(false), []);

  // Esc key listener for fullscreen
  useEffect(() => {
    if (!fullscreen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeFullscreen();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [fullscreen, closeFullscreen]);

  const getGroupColor = (pid: string): string | undefined =>
    groups.find((g) => g.members.some((m) => m.id === pid))?.color;

  const ranked: Participant[] = [...participants].sort(
    (a, b) => (scores[b.id] || 0) - (scores[a.id] || 0)
  );

  const totalPts = Object.values(scores).reduce((s, v) => s + v, 0);

  const rankMedal = (i: number, pts: number) => {
    if (pts === 0) return <span className="rank-num">{i + 1}</span>;
    if (i === 0) return <span className="rank-medal">🥇</span>;
    if (i === 1) return <span className="rank-medal">🥈</span>;
    if (i === 2) return <span className="rank-medal">🥉</span>;
    return <span className="rank-num">{i + 1}</span>;
  };

  if (participants.length === 0) {
    return (
      <div className="score-empty">
        <div className="score-empty-icon">🏆</div>
        <p>Dodaj uczestników, żeby śledzić punkty</p>
      </div>
    );
  }

  return (
    <div className="score-panel">

      {/* ── Action legend / config bar ─────────────────────── */}
      <div className="score-legend-bar">
        <span className="slb-title">Akcje:</span>
        {scoreActions.map((action) => (
          <div key={action.id} className="slb-action" title={action.label}>
            <span className="slb-emoji">{action.emoji}</span>
            <span className="slb-label">{action.label}</span>
            <span className="slb-eq">=</span>
            <input
              type="number"
              min={1}
              max={99}
              className="slb-pts-input"
              value={action.points}
              onChange={(e) => updateScoreAction(action.id, Number(e.target.value))}
              title={`Zmień wartość: ${action.label}`}
            />
            <span className="slb-pts-unit">pkt</span>
          </div>
        ))}
        <div className="slb-spacer" />
        <span className="slb-total">Σ {totalPts} pkt</span>
        <button
          className="btn sm slb-reset"
          onClick={() => { if (confirm('Zresetować wszystkie punkty?')) resetScores(); }}
          title="Wyczyść punkty"
        >
          ↺ Reset
        </button>
        <button
          className="btn sm"
          onClick={() => setFullscreen(true)}
          title="Ranking fullscreen (do projektora)"
          style={{ marginLeft: 4 }}
        >
          ⛶ Fullscreen
        </button>
      </div>

      {/* ── Ranking table ─────────────────────────────────── */}
      <div className="score-table-wrap">
        <table className="score-table">
          <thead>
            <tr>
              <th className="col-rank">#</th>
              <th className="col-name">Uczestnik</th>
              <th className="col-actions">Przyznaj punkty</th>
              <th className="col-pts">Pkt</th>
              <th className="col-undo"></th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((p, i) => {
              const gc   = getGroupColor(p.id);
              const pts  = scores[p.id] || 0;
              const hasLog = scoreLog.some((e) => e.participantId === p.id);

              return (
                <tr key={p.id} className={`score-row ${pts > 0 ? 'has-pts' : ''} ${i === 0 && pts > 0 ? 'rank-first' : ''}`}>
                  <td className="col-rank">{rankMedal(i, pts)}</td>
                  <td className="col-name">
                    {gc && (
                      <span
                        className="score-gc-dot"
                        style={{ background: gc }}
                        title={`Grupa ${groups.find(g => g.members.some(m => m.id === p.id))?.index}`}
                      />
                    )}
                    <span className="score-name-text">
                      {p.first}
                      {p.last ? <span className="score-last">&nbsp;{p.last[0]}.</span> : null}
                    </span>
                  </td>
                  <td className="col-actions">
                    <div className="score-action-btns">
                      {scoreActions.map((action) => (
                        <button
                          key={action.id}
                          className="score-action-btn"
                          title={`${action.label} (+${action.points} pkt)`}
                          onClick={() => addScore(p.id, action.id)}
                        >
                          <span className="sab-emoji">{action.emoji}</span>
                          <span className="sab-pts">+{action.points}</span>
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="col-pts">
                    <span className={`pts-badge ${pts > 0 ? 'pts-pos' : ''}`}>
                      {pts > 0 ? pts : '—'}
                    </span>
                  </td>
                  <td className="col-undo">
                    {hasLog && (
                      <button
                        className="undo-btn"
                        title="Cofnij ostatni punkt"
                        onClick={() => removeLastScore(p.id)}
                      >
                        ⟲
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Fullscreen leaderboard overlay ─────────────────── */}
      {fullscreen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'var(--bg)', color: 'var(--txt-main)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '40px 20px', overflow: 'auto',
        }}>
          <button
            onClick={closeFullscreen}
            style={{
              position: 'absolute', top: 20, right: 28,
              background: 'none', border: 'none', color: 'var(--txt-muted)',
              fontSize: '2rem', cursor: 'pointer', lineHeight: 1,
            }}
            title="Zamknij (Esc)"
          >
            ✕
          </button>
          <div style={{ fontSize: '1.5rem', color: 'var(--txt-muted)', marginBottom: 24, letterSpacing: 1 }}>
            🏆 RANKING
          </div>
          <div style={{ width: '100%', maxWidth: 800 }}>
            {ranked.map((p, i) => {
              const pts = scores[p.id] || 0;
              const medal = pts > 0 && i === 0 ? '🥇' : pts > 0 && i === 1 ? '🥈' : pts > 0 && i === 2 ? '🥉' : null;
              return (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 24px', marginBottom: 6,
                  background: i < 3 && pts > 0 ? 'rgba(255,255,255,.06)' : 'transparent',
                  borderRadius: 12,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ fontSize: '2rem', minWidth: 50, textAlign: 'center' }}>
                      {medal || `${i + 1}.`}
                    </span>
                    <span style={{ fontSize: '3rem', fontWeight: 800 }}>
                      {p.first}{p.last ? ` ${p.last[0]}.` : ''}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '4rem', fontWeight: 900,
                    color: pts > 0 ? 'var(--accent)' : 'var(--txt-muted)',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {pts > 0 ? pts : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
