import { useState, useMemo, useRef } from 'react';
import { useStore } from '../../store';
import { logActivity } from '../../lib/activityLog';
import { FullscreenButton } from '../ui/FullscreenButton';

// ── Types ────────────────────────────────────────────────────────────────────
type EnergyMode = 'fist' | 'quick';

interface SavedCheck {
  id: string;
  label: string;
  mode: EnergyMode;
  timestamp: number;
  // Fist of Five data
  ratings: Record<string, number>; // participantId -> 1-5
  // Quick Average data
  counts: number[]; // index 0-4 = level 1-5
}

// ── Helpers ──────────────────────────────────────────────────────────────────
let _id = 0;
const uid = () => `en-${Date.now()}-${++_id}`;

const LEVEL_COLORS = ['#e53935', '#ff9800', '#ffea09', '#8bc34a', '#4caf50'];
const LEVEL_LABELS = ['1 — Bardzo nisko', '2 — Nisko', '3 — Średnio', '4 — Wysoko', '5 — Bardzo wysoko'];

function fmtTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
}

// ── Component ────────────────────────────────────────────────────────────────
export function EnergyPanel() {
  const panelRef = useRef<HTMLDivElement>(null);
  const participants = useStore((s) => s.participants);

  const [mode, setMode] = useState<EnergyMode>('quick');
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [counts, setCounts] = useState<number[]>([0, 0, 0, 0, 0]);
  const [history, setHistory] = useState<SavedCheck[]>([]);
  const [saveLabel, setSaveLabel] = useState('');
  const [showCompare, setShowCompare] = useState(false);

  // ── Fist of Five actions ──────────────────────────────────
  const setRating = (participantId: string, level: number) => {
    setRatings((prev) => ({ ...prev, [participantId]: level }));
  };

  const fistAvg = useMemo(() => {
    const vals = Object.values(ratings);
    if (vals.length === 0) return 0;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }, [ratings]);

  const fistDistribution = useMemo(() => {
    const dist = [0, 0, 0, 0, 0];
    Object.values(ratings).forEach((v) => dist[v - 1]++);
    return dist;
  }, [ratings]);

  // ── Quick Average actions ─────────────────────────────────
  const incrementCount = (level: number) => {
    setCounts((prev) => {
      const next = [...prev];
      next[level]++;
      return next;
    });
  };

  const decrementCount = (level: number) => {
    setCounts((prev) => {
      const next = [...prev];
      next[level] = Math.max(0, next[level] - 1);
      return next;
    });
  };

  const quickTotal = counts.reduce((a, b) => a + b, 0);
  const quickAvg = useMemo(() => {
    if (quickTotal === 0) return 0;
    const sum = counts.reduce((acc, c, i) => acc + c * (i + 1), 0);
    return sum / quickTotal;
  }, [counts, quickTotal]);

  // ── Save / Reset ──────────────────────────────────────────
  const saveCheck = () => {
    const label = saveLabel.trim() || `Check ${history.length + 1}`;
    const check: SavedCheck = {
      id: uid(),
      label,
      mode,
      timestamp: Date.now(),
      ratings: { ...ratings },
      counts: [...counts],
    };
    setHistory((prev) => [...prev, check]);

    // Log per-participant energy ratings
    if (mode === 'fist') {
      for (const [pid, level] of Object.entries(ratings)) {
        logActivity({ participantId: pid, panel: 'energy', action: 'rated', data: { level, label } });
      }
    }

    setSaveLabel('');
    // Reset current
    setRatings({});
    setCounts([0, 0, 0, 0, 0]);
  };

  const hasData = mode === 'fist' ? Object.keys(ratings).length > 0 : quickTotal > 0;

  // ── Distribution bar renderer ─────────────────────────────
  const renderDistBars = (dist: number[], max?: number) => {
    const localMax = max ?? Math.max(...dist, 1);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {dist.map((count, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 20, fontSize: 13, color: LEVEL_COLORS[i], fontWeight: 700, textAlign: 'center' }}>
              {i + 1}
            </span>
            <div
              style={{
                flex: 1,
                height: 18,
                background: 'var(--input-bg)',
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${localMax > 0 ? (count / localMax) * 100 : 0}%`,
                  height: '100%',
                  background: LEVEL_COLORS[i],
                  borderRadius: 4,
                  transition: 'width 0.3s ease',
                  minWidth: count > 0 ? 4 : 0,
                }}
              />
            </div>
            <span style={{ width: 24, fontSize: 12, color: 'var(--txt-muted)', textAlign: 'right' }}>
              {count}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="panel energy-panel" ref={panelRef} style={{ overflow: 'auto', padding: '16px', flex: 1 }}>
      {/* Fullscreen + Mode toggle */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <FullscreenButton targetRef={panelRef} />
      </div>
      <div
        style={{
          display: 'flex',
          gap: 0,
          marginBottom: 20,
          background: 'var(--input-bg)',
          borderRadius: 'var(--radius)',
          padding: 3,
        }}
      >
        {(['quick', 'fist'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              borderRadius: 'calc(var(--radius) - 2px)',
              background: mode === m ? 'var(--accent)' : 'transparent',
              color: mode === m ? '#fff' : 'var(--txt-muted)',
              fontWeight: mode === m ? 700 : 400,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {m === 'quick' ? 'Quick Average' : 'Fist of Five'}
          </button>
        ))}
      </div>

      {/* ── Quick Average Mode ─────────────────────────────── */}
      {mode === 'quick' && (
        <div>
          <p style={{ color: 'var(--txt-muted)', fontSize: 13, marginBottom: 16 }}>
            Kliknij poziom energii, gdy uczestnicy podnoszą palce.
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
            {counts.map((c, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <button
                  onClick={() => incrementCount(i)}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 'var(--radius)',
                    border: `2px solid ${LEVEL_COLORS[i]}`,
                    background: `${LEVEL_COLORS[i]}18`,
                    color: LEVEL_COLORS[i],
                    fontSize: 22,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.1s',
                  }}
                  title={LEVEL_LABELS[i]}
                >
                  {i + 1}
                </button>
                <span style={{ fontSize: 18, fontWeight: 700, color: LEVEL_COLORS[i] }}>
                  {c}
                </span>
                {c > 0 && (
                  <button
                    onClick={() => decrementCount(i)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--txt-muted)',
                      fontSize: 11,
                      cursor: 'pointer',
                      padding: '2px 6px',
                    }}
                  >
                    -1
                  </button>
                )}
              </div>
            ))}
          </div>

          {quickTotal > 0 && (
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 13, color: 'var(--txt-muted)' }}>
                Odpowiedzi: <strong style={{ color: 'var(--txt-main)' }}>{quickTotal}</strong>
              </span>
              <span style={{ margin: '0 12px', opacity: 0.3 }}>|</span>
              <span style={{ fontSize: 13, color: 'var(--txt-muted)' }}>
                Średnia:{' '}
                <strong style={{ color: LEVEL_COLORS[Math.round(quickAvg) - 1] || 'var(--txt-main)', fontSize: 18 }}>
                  {quickAvg.toFixed(1)}
                </strong>
              </span>
            </div>
          )}

          {quickTotal > 0 && renderDistBars(counts)}
        </div>
      )}

      {/* ── Fist of Five Mode ──────────────────────────────── */}
      {mode === 'fist' && (
        <div>
          {participants.length === 0 ? (
            <p style={{ color: 'var(--txt-muted)', textAlign: 'center', marginTop: 20 }}>
              Dodaj uczestników w zakładce "Uczestnicy", aby używać Fist of Five.
            </p>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
                {participants.map((p) => {
                  const current = ratings[p.id] || 0;
                  return (
                    <div
                      key={p.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '6px 10px',
                        borderRadius: 8,
                        background: current > 0 ? `${LEVEL_COLORS[current - 1]}10` : 'transparent',
                      }}
                    >
                      <span
                        style={{
                          flex: 1,
                          fontSize: 13,
                          color: 'var(--txt-main)',
                          minWidth: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {p.text || `${p.first} ${p.last}`.trim()}
                      </span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[1, 2, 3, 4, 5].map((lvl) => (
                          <button
                            key={lvl}
                            onClick={() => setRating(p.id, lvl)}
                            style={{
                              width: 30,
                              height: 28,
                              borderRadius: 6,
                              border: current === lvl ? `2px solid ${LEVEL_COLORS[lvl - 1]}` : '1px solid var(--line)',
                              background: current === lvl ? `${LEVEL_COLORS[lvl - 1]}30` : 'var(--input-bg)',
                              color: current === lvl ? LEVEL_COLORS[lvl - 1] : 'var(--txt-muted)',
                              fontWeight: current === lvl ? 800 : 400,
                              fontSize: 13,
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                            }}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              {Object.keys(ratings).length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ textAlign: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, color: 'var(--txt-muted)' }}>
                      Oceniono: <strong style={{ color: 'var(--txt-main)' }}>{Object.keys(ratings).length}</strong>
                      /{participants.length}
                    </span>
                    <span style={{ margin: '0 12px', opacity: 0.3 }}>|</span>
                    <span style={{ fontSize: 13, color: 'var(--txt-muted)' }}>
                      Średnia:{' '}
                      <strong
                        style={{
                          color: LEVEL_COLORS[Math.round(fistAvg) - 1] || 'var(--txt-main)',
                          fontSize: 18,
                        }}
                      >
                        {fistAvg.toFixed(1)}
                      </strong>
                    </span>
                  </div>
                  {renderDistBars(fistDistribution)}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Save section ───────────────────────────────────── */}
      {hasData && (
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginTop: 20,
            paddingTop: 16,
            borderTop: '1px solid var(--line)',
          }}
        >
          <input
            style={{
              flex: 1,
              background: 'var(--input-bg)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius)',
              color: 'var(--txt-main)',
              padding: '8px 12px',
              fontSize: 13,
              outline: 'none',
            }}
            placeholder='Etykieta (np. "Rano", "Po obiedzie")'
            value={saveLabel}
            onChange={(e) => setSaveLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveCheck()}
            maxLength={40}
          />
          <button className="btn primary" onClick={saveCheck} style={{ whiteSpace: 'nowrap' }}>
            Zapisz check
          </button>
        </div>
      )}

      {/* ── History & Compare ──────────────────────────────── */}
      {history.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h4 style={{ margin: 0, fontSize: 14, color: 'var(--txt-main)' }}>
              Historia ({history.length})
            </h4>
            <button
              className="btn"
              onClick={() => setShowCompare((v) => !v)}
              style={{ fontSize: 12, padding: '4px 10px' }}
            >
              {showCompare ? 'Ukryj porównanie' : 'Porównaj'}
            </button>
          </div>

          {showCompare ? (
            /* Side-by-side compare */
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${Math.min(history.length, 4)}, 1fr)`,
                gap: 10,
              }}
            >
              {history.map((check) => {
                const dist =
                  check.mode === 'fist'
                    ? (() => {
                        const d = [0, 0, 0, 0, 0];
                        Object.values(check.ratings).forEach((v) => d[v - 1]++);
                        return d;
                      })()
                    : check.counts;
                const total = dist.reduce((a, b) => a + b, 0);
                const avg = total > 0 ? dist.reduce((a, c, i) => a + c * (i + 1), 0) / total : 0;
                const globalMax = Math.max(
                  ...history.flatMap((h) => {
                    if (h.mode === 'fist') {
                      const d2 = [0, 0, 0, 0, 0];
                      Object.values(h.ratings).forEach((v) => d2[v - 1]++);
                      return d2;
                    }
                    return h.counts;
                  }),
                  1,
                );

                return (
                  <div
                    key={check.id}
                    style={{
                      background: 'var(--input-bg)',
                      borderRadius: 'var(--radius)',
                      padding: 12,
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt-main)', marginBottom: 2 }}>
                      {check.label}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--txt-muted)', marginBottom: 10 }}>
                      {fmtTime(check.timestamp)} &middot; avg{' '}
                      <strong style={{ color: LEVEL_COLORS[Math.round(avg) - 1] || 'var(--txt-main)' }}>
                        {avg.toFixed(1)}
                      </strong>
                    </div>
                    {renderDistBars(dist, globalMax)}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Simple list */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {history.map((check) => {
                const dist =
                  check.mode === 'fist'
                    ? (() => {
                        const d = [0, 0, 0, 0, 0];
                        Object.values(check.ratings).forEach((v) => d[v - 1]++);
                        return d;
                      })()
                    : check.counts;
                const total = dist.reduce((a, b) => a + b, 0);
                const avg = total > 0 ? dist.reduce((a, c, i) => a + c * (i + 1), 0) / total : 0;

                return (
                  <div
                    key={check.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '8px 12px',
                      background: 'var(--input-bg)',
                      borderRadius: 8,
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--txt-main)', minWidth: 80 }}>
                      {check.label}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--txt-muted)' }}>{fmtTime(check.timestamp)}</span>
                    <span style={{ fontSize: 12, color: 'var(--txt-muted)' }}>n={total}</span>
                    <span
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: LEVEL_COLORS[Math.round(avg) - 1] || 'var(--txt-main)',
                        marginLeft: 'auto',
                      }}
                    >
                      {avg.toFixed(1)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
