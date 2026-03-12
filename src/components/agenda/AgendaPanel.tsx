import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────
interface AgendaBlock {
  id: string;
  title: string;
  duration: number; // minutes
  status: 'pending' | 'active' | 'done';
  elapsed: number;  // seconds elapsed
}

let _aId = 0;
const aId = () => `ag-${++_aId}`;

// ── Audio helpers ────────────────────────────────────────────────────────────
function playWarning() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 660;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
    setTimeout(() => ctx.close(), 1000);
  } catch { /* silent */ }
}

function playUrgent() {
  try {
    const ctx = new AudioContext();
    // Two quick beeps
    for (let i = 0; i < 2; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'square';
      const t = ctx.currentTime + i * 0.25;
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
      osc.start(t);
      osc.stop(t + 0.2);
    }
    setTimeout(() => ctx.close(), 1000);
  } catch { /* silent */ }
}

function playChime() {
  try {
    const ctx = new AudioContext();
    const freqs = [523, 659, 784]; // C5, E5, G5 chord
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      const t = ctx.currentTime + i * 0.15;
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);
      osc.start(t);
      osc.stop(t + 0.8);
    });
    setTimeout(() => ctx.close(), 2000);
  } catch { /* silent */ }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmtTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function fmtClock(date: Date): string {
  return date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
}

// ── Component ────────────────────────────────────────────────────────────────
export function AgendaPanel() {
  const [blocks, setBlocks] = useState<AgendaBlock[]>([]);
  const [titleInput, setTitleInput] = useState('');
  const [durationInput, setDurationInput] = useState('');
  const [alarmsEnabled, setAlarmsEnabled] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Track which blocks already got warnings to avoid repeats
  const warnedRef = useRef<Record<string, { warn5: boolean; warn1: boolean; done: boolean }>>({});

  // Alarm checker — runs on every block update
  useEffect(() => {
    if (!alarmsEnabled) return;
    for (const b of blocks) {
      if (b.status !== 'active' && b.status !== 'done') continue;
      if (!warnedRef.current[b.id]) {
        warnedRef.current[b.id] = { warn5: false, warn1: false, done: false };
      }
      const w = warnedRef.current[b.id];
      const remaining = b.duration * 60 - b.elapsed;

      // 5-minute warning
      if (remaining <= 300 && remaining > 60 && !w.warn5 && b.duration > 5) {
        w.warn5 = true;
        playWarning();
      }
      // 1-minute warning
      if (remaining <= 60 && remaining > 0 && !w.warn1 && b.duration > 1) {
        w.warn1 = true;
        playUrgent();
      }
      // Completion chime
      if (remaining <= 0 && !w.done) {
        w.done = true;
        playChime();
      }
    }
  }, [blocks, alarmsEnabled]);

  // Tick active block
  useEffect(() => {
    const activeBlock = blocks.find((b) => b.status === 'active');
    if (activeBlock) {
      timerRef.current = setInterval(() => {
        setBlocks((prev) => prev.map((b) => {
          if (b.id !== activeBlock.id || b.status !== 'active') return b;
          const newElapsed = b.elapsed + 1;
          // Auto-advance when done
          if (newElapsed >= b.duration * 60) {
            return { ...b, elapsed: newElapsed, status: 'done' as const };
          }
          return { ...b, elapsed: newElapsed };
        }));
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [blocks.find((b) => b.status === 'active')?.id]);

  // Auto-start next block when current finishes
  useEffect(() => {
    const hasActive = blocks.some((b) => b.status === 'active');
    if (hasActive) return;

    const firstDoneNow = blocks.findIndex((b, i) => {
      if (b.status !== 'done') return false;
      const next = blocks[i + 1];
      return next && next.status === 'pending';
    });

    // Check if there's a just-completed block followed by a pending one
    // Only auto-advance if there was recently an active block (within 2s)
    if (firstDoneNow >= 0) {
      const prevActive = blocks[firstDoneNow];
      if (prevActive.elapsed >= prevActive.duration * 60) {
        setBlocks((prev) => prev.map((b, i) =>
          i === firstDoneNow + 1 ? { ...b, status: 'active' as const } : b
        ));
      }
    }
  }, [blocks]);

  const addBlock = useCallback(() => {
    const title = titleInput.trim();
    const dur = parseInt(durationInput, 10);
    if (!title || !dur || dur <= 0) return;
    setBlocks((prev) => [...prev, {
      id: aId(),
      title,
      duration: dur,
      status: 'pending',
      elapsed: 0,
    }]);
    setTitleInput('');
    setDurationInput('');
  }, [titleInput, durationInput]);

  const startBlock = useCallback((id: string) => {
    setBlocks((prev) => prev.map((b) => {
      if (b.id === id) return { ...b, status: 'active' as const, elapsed: 0 };
      if (b.status === 'active') return { ...b, status: 'done' as const };
      return b;
    }));
  }, []);

  const skipBlock = useCallback((id: string) => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx < 0) return prev;
      return prev.map((b, i) => {
        if (i === idx) return { ...b, status: 'done' as const };
        if (i === idx + 1 && b.status === 'pending') return { ...b, status: 'active' as const };
        return b;
      });
    });
  }, []);

  const removeBlock = useCallback((id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const moveUp = useCallback((index: number) => {
    if (index <= 0) return;
    setBlocks((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }, []);

  const moveDown = useCallback((index: number) => {
    setBlocks((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }, []);

  const resetAll = useCallback(() => {
    if (blocks.length > 0 && confirm('Wyczyścić agendę?')) {
      setBlocks([]);
    }
  }, [blocks.length]);

  // Computed values
  const totalPlanned = useMemo(() => blocks.reduce((s, b) => s + b.duration * 60, 0), [blocks]);
  const totalElapsed = useMemo(() => blocks.reduce((s, b) => s + b.elapsed, 0), [blocks]);
  const overallProgress = totalPlanned > 0 ? Math.min(100, (totalElapsed / totalPlanned) * 100) : 0;

  const plannedEnd = useMemo(() => {
    const now = new Date();
    const remainingSec = totalPlanned - totalElapsed;
    return new Date(now.getTime() + remainingSec * 1000);
  }, [totalPlanned, totalElapsed]);

  const diffSeconds = totalPlanned - totalElapsed;
  const isAhead = diffSeconds > 0;
  const hasActive = blocks.some((b) => b.status === 'active');

  return (
    <div className="panel agenda-panel" style={{ overflow: 'auto', padding: '16px', flex: 1 }}>
      <style>{agendaCSS}</style>

      {/* Day progress bar */}
      {blocks.length > 0 && (
        <div className="ag-progress-section">
          <div className="ag-progress-info">
            <span className="ag-progress-label">
              Postęp dnia: {fmtTime(totalElapsed)} / {fmtTime(totalPlanned)}
            </span>
            <span className={`ag-progress-eta ${!isAhead && hasActive ? 'behind' : ''}`}>
              {hasActive ? (
                isAhead
                  ? `Planowany koniec: ${fmtClock(plannedEnd)}`
                  : `Przekroczono czas o ${fmtTime(Math.abs(diffSeconds))}`
              ) : (
                `Zaplanowano: ${fmtTime(totalPlanned)}`
              )}
            </span>
          </div>
          <div className="ag-progress-bar">
            <div
              className={`ag-progress-fill ${overallProgress >= 100 ? 'over' : ''}`}
              style={{ width: `${Math.min(100, overallProgress)}%` }}
            />
          </div>
        </div>
      )}

      {/* Add block */}
      <div className="ag-add-row">
        <input
          className="ag-title-input"
          placeholder="Tytuł bloku..."
          value={titleInput}
          onChange={(e) => setTitleInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') addBlock(); }}
        />
        <div className="ag-dur-wrap">
          <input
            className="ag-dur-input"
            type="number"
            min={1}
            max={480}
            placeholder="min"
            value={durationInput}
            onChange={(e) => setDurationInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addBlock(); }}
          />
          <span className="ag-dur-unit">min</span>
        </div>
        <button
          className="btn primary"
          onClick={addBlock}
          disabled={!titleInput.trim() || !durationInput || parseInt(durationInput) <= 0}
        >
          Dodaj blok
        </button>
        <button className="btn danger" onClick={resetAll} disabled={blocks.length === 0}>
          Reset
        </button>
        <button
          className={`ag-alarm-toggle ${alarmsEnabled ? 'on' : 'off'}`}
          onClick={() => setAlarmsEnabled((v) => !v)}
          title={alarmsEnabled ? 'Alarmy czasowe włączone' : 'Alarmy czasowe wyłączone'}
        >
          {alarmsEnabled ? '\uD83D\uDD14' : '\uD83D\uDD15'}
        </button>
      </div>

      {/* Timeline */}
      {blocks.length === 0 ? (
        <div className="ag-empty">
          <div className="ag-empty-icon">📋</div>
          <p>Dodaj bloki, aby zbudować agendę dnia</p>
        </div>
      ) : (
        <div className="ag-timeline">
          {blocks.map((block, i) => {
            const planned = block.duration * 60;
            const progress = planned > 0 ? Math.min(100, (block.elapsed / planned) * 100) : 0;
            const isOver = block.elapsed > planned;

            return (
              <div key={block.id} className={`ag-block ag-block--${block.status}`}>
                {/* Status icon */}
                <div className="ag-block-icon">
                  {block.status === 'done' && <span className="ag-icon-done">✓</span>}
                  {block.status === 'active' && <span className="ag-icon-active" />}
                  {block.status === 'pending' && <span className="ag-icon-pending" />}
                </div>

                {/* Content */}
                <div className="ag-block-content">
                  <div className="ag-block-header">
                    <span className="ag-block-title">{block.title}</span>
                    <span className="ag-block-dur">
                      {block.status === 'active' || block.status === 'done'
                        ? `${fmtTime(block.elapsed)} / ${block.duration} min`
                        : `${block.duration} min`
                      }
                    </span>
                  </div>

                  {/* Progress bar */}
                  {(block.status === 'active' || block.status === 'done') && (
                    <div className="ag-block-bar">
                      <div
                        className={`ag-block-bar-fill ${isOver ? 'over' : ''}`}
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="ag-block-actions">
                  {block.status === 'pending' && (
                    <button className="btn sm primary" onClick={() => startBlock(block.id)}>
                      Start
                    </button>
                  )}
                  {block.status === 'active' && (
                    <button className="btn sm" onClick={() => skipBlock(block.id)}>
                      Zakończ ▸
                    </button>
                  )}
                  <div className="ag-reorder">
                    <button
                      className="ag-arrow"
                      onClick={() => moveUp(i)}
                      disabled={i === 0}
                      title="W górę"
                    >▲</button>
                    <button
                      className="ag-arrow"
                      onClick={() => moveDown(i)}
                      disabled={i === blocks.length - 1}
                      title="W dół"
                    >▼</button>
                  </div>
                  <button
                    className="ag-remove"
                    onClick={() => removeBlock(block.id)}
                    title="Usuń blok"
                  >✕</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── CSS ──────────────────────────────────────────────────────────────────────
const agendaCSS = `
.agenda-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* Progress section */
.ag-progress-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ag-progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.ag-progress-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--txt-muted);
  text-transform: uppercase;
  letter-spacing: .3px;
}
.ag-progress-eta {
  font-size: 12px;
  color: var(--green);
  font-weight: 600;
}
.ag-progress-eta.behind {
  color: var(--accent);
}
.ag-progress-bar {
  height: 6px;
  background: var(--input-bg);
  border-radius: 99px;
  overflow: hidden;
  border: 1px solid var(--line);
}
.ag-progress-fill {
  height: 100%;
  background: var(--green);
  border-radius: 99px;
  transition: width .5s ease;
}
.ag-progress-fill.over {
  background: var(--accent);
}

/* Add row */
.ag-add-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.ag-title-input {
  flex: 1;
  padding: 8px 14px;
  background: var(--input-bg);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  color: var(--txt-main);
  font-size: 13px;
}
.ag-title-input::placeholder { color: var(--txt-muted); }
.ag-dur-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--input-bg);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 0 10px 0 0;
}
.ag-dur-input {
  width: 56px;
  padding: 8px 8px 8px 14px;
  background: transparent;
  border: none;
  color: var(--txt-main);
  font-size: 13px;
  text-align: center;
}
.ag-dur-input::placeholder { color: var(--txt-muted); }
.ag-dur-unit {
  font-size: 11px;
  color: var(--txt-muted);
  font-weight: 600;
}

/* Empty */
.ag-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--txt-muted);
  padding: 40px 0;
}
.ag-empty-icon { font-size: 48px; margin-bottom: 8px; }

/* Timeline */
.ag-timeline {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ag-block {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: var(--input-bg);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  transition: all .2s;
  animation: ag-appear .25s ease-out;
}
@keyframes ag-appear {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}

.ag-block--active {
  border-color: var(--green);
  box-shadow: 0 0 16px rgba(76,175,80,.12);
}
.ag-block--done {
  opacity: .55;
}

/* Status icons */
.ag-block-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.ag-icon-done {
  width: 22px; height: 22px;
  background: var(--green);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 800;
  color: #fff;
}
.ag-icon-active {
  width: 18px; height: 18px;
  background: var(--green);
  border-radius: 50%;
  animation: ag-pulse 1.2s ease-in-out infinite;
}
@keyframes ag-pulse {
  0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 rgba(76,175,80,.4); }
  50%      { opacity: .8; transform: scale(1.15); box-shadow: 0 0 8px 4px rgba(76,175,80,.15); }
}
.ag-icon-pending {
  width: 14px; height: 14px;
  border: 2px solid var(--txt-muted);
  border-radius: 50%;
  opacity: .4;
}

/* Block content */
.ag-block-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.ag-block-header {
  display: flex;
  align-items: baseline;
  gap: 10px;
  justify-content: space-between;
}
.ag-block-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--txt-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ag-block-dur {
  font-size: 12px;
  color: var(--txt-muted);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.ag-block-bar {
  height: 4px;
  background: rgba(255,255,255,.06);
  border-radius: 99px;
  overflow: hidden;
}
.ag-block-bar-fill {
  height: 100%;
  background: var(--green);
  border-radius: 99px;
  transition: width .5s ease;
}
.ag-block-bar-fill.over { background: var(--accent); }

/* Actions */
.ag-block-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.ag-reorder {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.ag-arrow {
  background: none;
  border: none;
  color: var(--txt-muted);
  font-size: 9px;
  padding: 1px 4px;
  cursor: pointer;
  border-radius: 3px;
  line-height: 1;
}
.ag-arrow:hover { color: var(--txt-main); background: rgba(255,255,255,.08); }
.ag-arrow:disabled { opacity: .3; cursor: not-allowed; }
.ag-remove {
  background: none;
  border: none;
  color: var(--txt-muted);
  font-size: 12px;
  padding: 3px 6px;
  cursor: pointer;
  border-radius: 4px;
}
.ag-remove:hover { color: var(--accent); background: rgba(233,30,99,.15); }

/* Alarm toggle */
.ag-alarm-toggle {
  background: none;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  font-size: 16px;
  padding: 6px 10px;
  cursor: pointer;
  transition: all .2s;
  line-height: 1;
}
.ag-alarm-toggle.on {
  border-color: var(--green);
  background: rgba(76,175,80,.1);
}
.ag-alarm-toggle.off {
  opacity: .5;
}
.ag-alarm-toggle:hover { opacity: 1; }
`;
