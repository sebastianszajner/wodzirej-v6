import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useStore } from '../../store';
import { logActivity } from '../../lib/activityLog';
import { FullscreenButton } from '../ui/FullscreenButton';

// ── Types ────────────────────────────────────────────────────────────────────
interface QueueItem {
  id: string;
  participantId: string;
  name: string;
}

interface HistoryEntry {
  participantId: string;
  name: string;
  duration: number; // seconds
}

let _qId = 0;
const qId = () => `q-${++_qId}`;

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ── Component ────────────────────────────────────────────────────────────────
export function QueuePanel() {
  const panelRef = useRef<HTMLDivElement>(null);
  const participants = useStore((s) => s.participants);

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [current, setCurrent] = useState<QueueItem | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer tick
  useEffect(() => {
    if (current && !paused) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [current, paused]);

  // Add participant to queue
  const addToQueue = useCallback((pid: string) => {
    const p = participants.find((x) => x.id === pid);
    if (!p) return;
    setQueue((prev) => [...prev, { id: qId(), participantId: pid, name: p.text }]);
  }, [participants]);

  // Start next speaker
  const startNext = useCallback(() => {
    // Save current to history
    if (current) {
      setHistory((prev) => [...prev, {
        participantId: current.participantId,
        name: current.name,
        duration: elapsed,
      }]);
    }
    // Pop from queue
    if (queue.length > 0) {
      const [next, ...rest] = queue;
      setCurrent(next);
      setQueue(rest);
      setElapsed(0);
      setPaused(false);
    } else {
      setCurrent(null);
      setElapsed(0);
      setPaused(false);
    }
  }, [current, elapsed, queue]);

  // Stop current without advancing
  const stopCurrent = useCallback(() => {
    if (current) {
      setHistory((prev) => [...prev, {
        participantId: current.participantId,
        name: current.name,
        duration: elapsed,
      }]);
      logActivity({ participantId: current.participantId, panel: 'queue', action: 'spoke', data: { duration: elapsed } });
      setCurrent(null);
      setElapsed(0);
      setPaused(false);
    }
  }, [current, elapsed]);

  // Random pick from participants
  const pickRandom = useCallback(() => {
    if (participants.length === 0) return;
    const p = participants[Math.floor(Math.random() * participants.length)];
    setQueue((prev) => [...prev, { id: qId(), participantId: p.id, name: p.text }]);
  }, [participants]);

  // Reorder queue
  const moveUp = useCallback((index: number) => {
    if (index <= 0) return;
    setQueue((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }, []);

  const moveDown = useCallback((index: number) => {
    setQueue((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }, []);

  const removeFromQueue = useCallback((id: string) => {
    setQueue((prev) => prev.filter((q) => q.id !== id));
  }, []);

  // Stats: per-participant speaking count & total time
  const stats = useMemo(() => {
    const map: Record<string, { name: string; count: number; totalTime: number }> = {};
    for (const h of history) {
      if (!map[h.participantId]) {
        map[h.participantId] = { name: h.name, count: 0, totalTime: 0 };
      }
      map[h.participantId].count += 1;
      map[h.participantId].totalTime += h.duration;
    }
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [history]);

  // Equity metrics
  const [equityOpen, setEquityOpen] = useState(false);

  const equityData = useMemo(() => {
    if (history.length === 0) return null;

    // Build per-participant total time + turn count (including participants who never spoke)
    const timeMap: Record<string, number> = {};
    const turnMap: Record<string, number> = {};
    for (const p of participants) {
      timeMap[p.id] = 0;
      turnMap[p.id] = 0;
    }
    for (const h of history) {
      timeMap[h.participantId] = (timeMap[h.participantId] || 0) + h.duration;
      turnMap[h.participantId] = (turnMap[h.participantId] || 0) + 1;
    }

    const entries = participants.map((p) => ({
      id: p.id,
      name: p.text || p.first,
      totalTime: timeMap[p.id] || 0,
      turns: turnMap[p.id] || 0,
      avgPerTurn: turnMap[p.id] > 0 ? Math.round((timeMap[p.id] || 0) / turnMap[p.id]) : 0,
    }));

    const maxTime = Math.max(...entries.map((e) => e.totalTime), 1);
    const totalTime = entries.reduce((s, e) => s + e.totalTime, 0);
    const avgTime = participants.length > 0 ? totalTime / participants.length : 0;

    // Equity score: ratio of min/max speaking time among those who spoke
    const spokeTimes = entries.filter((e) => e.totalTime > 0).map((e) => e.totalTime);
    const equityScore = spokeTimes.length >= 2
      ? Math.min(...spokeTimes) / Math.max(...spokeTimes)
      : spokeTimes.length === 1 ? 1.0 : 0;

    return { entries, maxTime, avgTime, equityScore };
  }, [history, participants]);

  const noParticipants = participants.length === 0;

  return (
    <div className="panel queue-panel" ref={panelRef} style={{ overflow: 'auto', padding: '16px', flex: 1 }}>
      <style>{queueCSS}</style>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <FullscreenButton targetRef={panelRef} />
      </div>

      {noParticipants ? (
        <div className="q-empty">
          <div className="q-empty-icon">🎤</div>
          <p>Dodaj uczestników, aby użyć kolejki mówców</p>
        </div>
      ) : (
        <div className="q-layout">
          {/* Left: speaker + queue */}
          <div className="q-main">
            {/* Current speaker */}
            <div className={`q-speaker-box ${current ? 'active' : ''}`}>
              {current ? (
                <>
                  <div className="q-speaker-label">Mówi teraz</div>
                  <div className="q-speaker-name">{current.name}</div>
                  <div className={`q-speaker-timer ${paused ? 'paused' : ''}`}>
                    {fmtTime(elapsed)}
                  </div>
                  <div className="q-speaker-controls">
                    <button className="btn sm" onClick={() => setPaused((p) => !p)}>
                      {paused ? '▶ Wznów' : '⏸ Pauza'}
                    </button>
                    <button className="btn sm primary" onClick={startNext}>
                      Następny ▸
                    </button>
                    <button className="btn sm danger" onClick={stopCurrent}>
                      ■ Stop
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="q-speaker-label">Brak mówcy</div>
                  <div className="q-speaker-name" style={{ color: 'var(--txt-muted)' }}>—</div>
                  {queue.length > 0 && (
                    <button className="btn primary" onClick={startNext}>
                      Rozpocznij ▸
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Add to queue */}
            <div className="q-add-section">
              <div className="q-add-title">Dodaj do kolejki</div>
              <div className="q-add-grid">
                {participants.map((p) => (
                  <button
                    key={p.id}
                    className="q-add-btn"
                    onClick={() => addToQueue(p.id)}
                    title={p.text}
                  >
                    {p.first}
                  </button>
                ))}
                <button className="q-add-btn q-random-btn" onClick={pickRandom} title="Losuj uczestnika">
                  🎲 Losuj
                </button>
              </div>
            </div>

            {/* Queue list */}
            <div className="q-queue-section">
              <div className="q-queue-title">
                Kolejka ({queue.length})
              </div>
              {queue.length === 0 ? (
                <div className="q-queue-empty">Kolejka jest pusta</div>
              ) : (
                <div className="q-queue-list">
                  {queue.map((item, i) => (
                    <div key={item.id} className="q-queue-item">
                      <span className="q-queue-num">{i + 1}</span>
                      <span className="q-queue-name">{item.name}</span>
                      <div className="q-queue-actions">
                        <button
                          className="q-queue-arrow"
                          onClick={() => moveUp(i)}
                          disabled={i === 0}
                          title="W górę"
                        >▲</button>
                        <button
                          className="q-queue-arrow"
                          onClick={() => moveDown(i)}
                          disabled={i === queue.length - 1}
                          title="W dół"
                        >▼</button>
                        <button
                          className="q-queue-remove"
                          onClick={() => removeFromQueue(item.id)}
                          title="Usuń"
                        >✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: history + stats */}
          <div className="q-sidebar">
            {/* Stats */}
            {stats.length > 0 && (
              <div className="q-stats-section">
                <div className="q-section-title">Kto ile razy mówił</div>
                <div className="q-stats-list">
                  {stats.map((s) => (
                    <div key={s.name} className="q-stat-row">
                      <span className="q-stat-name">{s.name}</span>
                      <span className="q-stat-count">{s.count}×</span>
                      <span className="q-stat-time">{fmtTime(s.totalTime)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Equity metrics */}
            {equityData && (
              <div className="q-equity-section">
                <button
                  className="q-equity-toggle"
                  onClick={() => setEquityOpen((v) => !v)}
                >
                  <span>{equityOpen ? '▾' : '▸'} 📊 Równość głosu</span>
                </button>
                {equityOpen && (
                  <div className="q-equity-list">
                    {/* Equity score */}
                    <div className="q-equity-score-row">
                      <span className="q-equity-score-label">Wskaźnik równości</span>
                      <span className={`q-equity-score-value ${
                        equityData.equityScore >= 0.7 ? 'good' : equityData.equityScore >= 0.4 ? 'mid' : 'low'
                      }`}>
                        {equityData.equityScore.toFixed(2)}
                      </span>
                    </div>
                    {/* Average line label */}
                    <div className="q-equity-avg-label">
                      Średnia: {fmtTime(Math.round(equityData.avgTime))}
                    </div>
                    {equityData.entries.map((e) => {
                      const pct = equityData.maxTime > 0 ? (e.totalTime / equityData.maxTime) * 100 : 0;
                      const diff = equityData.avgTime > 0
                        ? Math.abs(e.totalTime - equityData.avgTime) / equityData.avgTime
                        : 0;
                      const color = e.totalTime === 0 ? '#666'
                        : diff <= 0.2 ? '#4caf50'
                        : diff <= 0.5 ? '#ff9800'
                        : '#f44336';
                      const neverSpoke = e.totalTime === 0;

                      return (
                        <div key={e.id} className="q-equity-row">
                          <div className="q-equity-name">
                            {neverSpoke && <span title="Nie wypowiedział(a) się" style={{ marginRight: 3 }}>⚠️</span>}
                            {e.name}
                          </div>
                          <div className="q-equity-bar-wrap">
                            <div
                              className="q-equity-bar"
                              style={{ width: `${Math.max(pct, 2)}%`, background: color }}
                            />
                            {/* Average marker */}
                            {equityData.maxTime > 0 && (
                              <div
                                className="q-equity-avg-line"
                                style={{ left: `${(equityData.avgTime / equityData.maxTime) * 100}%` }}
                              />
                            )}
                          </div>
                          <div className="q-equity-detail">
                            <span className="q-equity-time">{fmtTime(e.totalTime)}</span>
                            <span className="q-equity-turns" title="Liczba wypowiedzi">{e.turns}×</span>
                            {e.turns > 0 && (
                              <span className="q-equity-avg-turn" title="Średni czas wypowiedzi">~{fmtTime(e.avgPerTurn)}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* History */}
            <div className="q-history-section">
              <div className="q-section-title">Historia ({history.length})</div>
              {history.length === 0 ? (
                <div className="q-history-empty">Brak historii</div>
              ) : (
                <div className="q-history-list">
                  {[...history].reverse().map((h, i) => (
                    <div key={`${h.participantId}-${i}`} className="q-history-item">
                      <span className="q-history-name">{h.name}</span>
                      <span className="q-history-dur">{fmtTime(h.duration)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── CSS ──────────────────────────────────────────────────────────────────────
const queueCSS = `
.queue-panel {
  display: flex;
  flex-direction: column;
}

.q-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--txt-muted);
}
.q-empty-icon { font-size: 48px; margin-bottom: 8px; }

.q-layout {
  display: flex;
  gap: 16px;
  flex: 1;
  min-height: 0;
}

.q-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.q-sidebar {
  width: 220px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}

/* Speaker box */
.q-speaker-box {
  background: var(--input-bg);
  border: 2px solid var(--line);
  border-radius: var(--radius);
  padding: 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  transition: border-color .3s;
}
.q-speaker-box.active {
  border-color: var(--green);
  box-shadow: 0 0 20px rgba(76,175,80,.15);
}
.q-speaker-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .5px;
  color: var(--txt-muted);
  font-weight: 700;
}
.q-speaker-name {
  font-size: 28px;
  font-weight: 800;
  color: var(--txt-main);
  letter-spacing: -.3px;
}
.q-speaker-timer {
  font-size: 36px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: var(--green);
  letter-spacing: 1px;
}
.q-speaker-timer.paused {
  color: var(--accent2);
  animation: q-blink 1s ease-in-out infinite;
}
@keyframes q-blink {
  0%, 100% { opacity: 1; }
  50%      { opacity: .4; }
}
.q-speaker-controls {
  display: flex;
  gap: 8px;
  margin-top: 6px;
}

/* Add to queue */
.q-add-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.q-add-title {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .5px;
  color: var(--txt-muted);
  font-weight: 700;
}
.q-add-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.q-add-btn {
  padding: 5px 10px;
  font-size: 12px;
  background: var(--input-bg);
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--txt-main);
  cursor: pointer;
  transition: background .15s;
}
.q-add-btn:hover { background: rgba(255,255,255,.08); }
.q-random-btn {
  border-color: var(--accent);
  color: var(--accent);
}
.q-random-btn:hover { background: rgba(233,30,99,.12); }

/* Queue list */
.q-queue-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-height: 0;
}
.q-queue-title {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .5px;
  color: var(--txt-muted);
  font-weight: 700;
}
.q-queue-empty {
  color: var(--txt-muted);
  font-size: 12px;
  padding: 8px 0;
}
.q-queue-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
}
.q-queue-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: var(--input-bg);
  border: 1px solid var(--line);
  border-radius: 8px;
  animation: q-slide .2s ease-out;
}
@keyframes q-slide {
  from { opacity: 0; transform: translateX(-8px); }
  to   { opacity: 1; transform: translateX(0); }
}
.q-queue-num {
  font-size: 11px;
  font-weight: 700;
  color: var(--txt-muted);
  min-width: 18px;
  text-align: center;
}
.q-queue-name {
  flex: 1;
  font-size: 13px;
  color: var(--txt-main);
}
.q-queue-actions {
  display: flex;
  gap: 2px;
}
.q-queue-arrow {
  background: none;
  border: none;
  color: var(--txt-muted);
  font-size: 10px;
  padding: 2px 4px;
  cursor: pointer;
  border-radius: 4px;
}
.q-queue-arrow:hover { color: var(--txt-main); background: rgba(255,255,255,.08); }
.q-queue-arrow:disabled { opacity: .3; cursor: not-allowed; }
.q-queue-remove {
  background: none;
  border: none;
  color: var(--txt-muted);
  font-size: 11px;
  padding: 2px 5px;
  cursor: pointer;
  border-radius: 4px;
}
.q-queue-remove:hover { color: var(--accent); background: rgba(233,30,99,.15); }

/* Sidebar sections */
.q-section-title {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .5px;
  color: var(--txt-muted);
  font-weight: 700;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--line);
}

.q-stats-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.q-stats-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.q-stat-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: var(--input-bg);
  border-radius: 6px;
  font-size: 12px;
}
.q-stat-name { flex: 1; color: var(--txt-main); }
.q-stat-count { color: var(--accent); font-weight: 700; min-width: 24px; text-align: right; }
.q-stat-time { color: var(--txt-muted); font-variant-numeric: tabular-nums; min-width: 36px; text-align: right; }

.q-history-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-height: 0;
}
.q-history-empty {
  color: var(--txt-muted);
  font-size: 12px;
}
.q-history-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
  overflow-y: auto;
}
.q-history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  background: var(--input-bg);
  border-radius: 6px;
  font-size: 12px;
}
.q-history-name { color: var(--txt-main); }
.q-history-dur { color: var(--txt-muted); font-variant-numeric: tabular-nums; }

/* Equity metrics */
.q-equity-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.q-equity-toggle {
  background: none;
  border: none;
  color: var(--txt-muted);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .5px;
  font-weight: 700;
  cursor: pointer;
  text-align: left;
  padding: 4px 0;
  border-bottom: 1px solid var(--line);
}
.q-equity-toggle:hover { color: var(--txt-main); }
.q-equity-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.q-equity-avg-label {
  font-size: 10px;
  color: var(--txt-muted);
  text-align: right;
  padding: 0 2px;
}
.q-equity-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}
.q-equity-name {
  min-width: 56px;
  max-width: 56px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--txt-main);
}
.q-equity-bar-wrap {
  flex: 1;
  height: 10px;
  background: rgba(255,255,255,.05);
  border-radius: 5px;
  position: relative;
  overflow: hidden;
}
.q-equity-bar {
  height: 100%;
  border-radius: 5px;
  transition: width .3s;
}
.q-equity-avg-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: rgba(255,255,255,.4);
  pointer-events: none;
}
.q-equity-detail {
  display: flex;
  gap: 4px;
  align-items: center;
  flex-shrink: 0;
}
.q-equity-time {
  min-width: 32px;
  text-align: right;
  color: var(--txt-muted);
  font-variant-numeric: tabular-nums;
}
.q-equity-turns {
  font-size: 10px;
  color: var(--accent);
  font-weight: 700;
  min-width: 18px;
  text-align: right;
}
.q-equity-avg-turn {
  font-size: 10px;
  color: var(--txt-muted);
  opacity: .7;
  min-width: 28px;
  text-align: right;
}
.q-equity-score-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 6px;
  background: var(--input-bg);
  border-radius: 6px;
  margin-bottom: 2px;
}
.q-equity-score-label {
  font-size: 10px;
  color: var(--txt-muted);
  font-weight: 600;
}
.q-equity-score-value {
  font-size: 14px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}
.q-equity-score-value.good { color: #4caf50; }
.q-equity-score-value.mid  { color: #ff9800; }
.q-equity-score-value.low  { color: #f44336; }

@media (max-width: 600px) {
  .q-layout { flex-direction: column; gap: 8px; }
  .q-sidebar { width: 100%; max-height: 180px; flex-shrink: 1; }
  .q-speaker-name { font-size: 22px !important; }
}
`;
