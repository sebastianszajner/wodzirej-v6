import { useState, useRef, useCallback, useEffect } from 'react';

type TimerStatus = 'idle' | 'running' | 'paused' | 'finished';
type TimerMode = 'timer' | 'intervals';
type IntervalPhase = 'work' | 'break';

const PRESETS = [1, 2, 3, 5, 10, 15];

function playBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.8);
    // Second beep
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.frequency.value = 1100;
    osc2.type = 'sine';
    gain2.gain.setValueAtTime(0.5, ctx.currentTime + 0.3);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);
    osc2.start(ctx.currentTime + 0.3);
    osc2.stop(ctx.currentTime + 1.2);
    // Third beep — longer
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.frequency.value = 1320;
    osc3.type = 'sine';
    gain3.gain.setValueAtTime(0.6, ctx.currentTime + 0.7);
    gain3.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2.0);
    osc3.start(ctx.currentTime + 0.7);
    osc3.stop(ctx.currentTime + 2.0);
  } catch {
    // Web Audio not supported — fail silently
  }
}

function playTransitionBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 660;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.frequency.value = 880;
    osc2.type = 'sine';
    gain2.gain.setValueAtTime(0.4, ctx.currentTime + 0.25);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
    osc2.start(ctx.currentTime + 0.25);
    osc2.stop(ctx.currentTime + 0.8);
  } catch {
    // fail silently
  }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function TimerPanel() {
  // ── Mode ──
  const [mode, setMode] = useState<TimerMode>('timer');

  // ── Standard timer state ──
  const [totalSeconds, setTotalSeconds] = useState(300); // 5 min default
  const [remaining, setRemaining] = useState(300);
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [fullscreen, setFullscreen] = useState(false);
  const [customMin, setCustomMin] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const beeped = useRef(false);

  // ── Interval (Pomodoro) state ──
  const [intWorkMin, setIntWorkMin] = useState(25);
  const [intBreakMin, setIntBreakMin] = useState(5);
  const [intRounds, setIntRounds] = useState(4);
  const [intCurrentRound, setIntCurrentRound] = useState(1);
  const [intPhase, setIntPhase] = useState<IntervalPhase>('work');
  const [intRemaining, setIntRemaining] = useState(25 * 60);
  const [intStatus, setIntStatus] = useState<TimerStatus>('idle');
  const [intPhaseDuration, setIntPhaseDuration] = useState(25 * 60);
  const intIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const clearIntTimer = useCallback(() => {
    if (intIntervalRef.current) {
      clearInterval(intIntervalRef.current);
      intIntervalRef.current = null;
    }
  }, []);

  // ── Standard timer tick ──
  const tick = useCallback(() => {
    setRemaining((prev) => {
      if (prev <= 1) {
        clearTimer();
        setStatus('finished');
        if (!beeped.current) {
          beeped.current = true;
          playBeep();
        }
        return 0;
      }
      return prev - 1;
    });
  }, [clearTimer]);

  // ── Interval timer tick (uses refs for state access) ──
  const intCurrentRoundRef = useRef(intCurrentRound);
  const intPhaseRef = useRef(intPhase);
  const intRoundsRef = useRef(intRounds);
  const intWorkMinRef = useRef(intWorkMin);
  const intBreakMinRef = useRef(intBreakMin);

  useEffect(() => { intCurrentRoundRef.current = intCurrentRound; }, [intCurrentRound]);
  useEffect(() => { intPhaseRef.current = intPhase; }, [intPhase]);
  useEffect(() => { intRoundsRef.current = intRounds; }, [intRounds]);
  useEffect(() => { intWorkMinRef.current = intWorkMin; }, [intWorkMin]);
  useEffect(() => { intBreakMinRef.current = intBreakMin; }, [intBreakMin]);

  const intTick = useCallback(() => {
    setIntRemaining((prev) => {
      if (prev <= 1) {
        const phase = intPhaseRef.current;
        const round = intCurrentRoundRef.current;
        const rounds = intRoundsRef.current;

        if (phase === 'work') {
          // Work phase ended
          if (round >= rounds) {
            // All rounds done
            clearIntTimer();
            setIntStatus('finished');
            playBeep();
            return 0;
          }
          // Switch to break
          playTransitionBeep();
          setIntPhase('break');
          const breakSecs = intBreakMinRef.current * 60;
          setIntPhaseDuration(breakSecs);
          return breakSecs;
        } else {
          // Break phase ended — next round
          playTransitionBeep();
          setIntCurrentRound((r) => r + 1);
          setIntPhase('work');
          const workSecs = intWorkMinRef.current * 60;
          setIntPhaseDuration(workSecs);
          return workSecs;
        }
      }
      return prev - 1;
    });
  }, [clearIntTimer]);

  // ── Standard timer handlers ──
  const handleStart = useCallback(() => {
    if (totalSeconds <= 0) return;
    beeped.current = false;
    setRemaining(totalSeconds);
    setStatus('running');
    clearTimer();
    intervalRef.current = setInterval(tick, 1000);
  }, [totalSeconds, tick, clearTimer]);

  const handlePause = useCallback(() => {
    clearTimer();
    setStatus('paused');
  }, [clearTimer]);

  const handleResume = useCallback(() => {
    setStatus('running');
    clearTimer();
    intervalRef.current = setInterval(tick, 1000);
  }, [tick, clearTimer]);

  const handleReset = useCallback(() => {
    clearTimer();
    setRemaining(totalSeconds);
    setStatus('idle');
    beeped.current = false;
  }, [totalSeconds, clearTimer]);

  const selectPreset = (minutes: number) => {
    clearTimer();
    const secs = minutes * 60;
    setTotalSeconds(secs);
    setRemaining(secs);
    setStatus('idle');
    beeped.current = false;
  };

  const handleCustom = () => {
    const mins = parseInt(customMin, 10);
    if (mins > 0 && mins <= 180) {
      selectPreset(mins);
      setCustomMin('');
    }
  };

  // ── Interval handlers ──
  const intStart = useCallback(() => {
    const workSecs = intWorkMin * 60;
    setIntCurrentRound(1);
    setIntPhase('work');
    setIntRemaining(workSecs);
    setIntPhaseDuration(workSecs);
    setIntStatus('running');
    clearIntTimer();
    intIntervalRef.current = setInterval(intTick, 1000);
  }, [intWorkMin, intTick, clearIntTimer]);

  const intPause = useCallback(() => {
    clearIntTimer();
    setIntStatus('paused');
  }, [clearIntTimer]);

  const intResume = useCallback(() => {
    setIntStatus('running');
    clearIntTimer();
    intIntervalRef.current = setInterval(intTick, 1000);
  }, [intTick, clearIntTimer]);

  const intReset = useCallback(() => {
    clearIntTimer();
    const workSecs = intWorkMin * 60;
    setIntCurrentRound(1);
    setIntPhase('work');
    setIntRemaining(workSecs);
    setIntPhaseDuration(workSecs);
    setIntStatus('idle');
  }, [intWorkMin, clearIntTimer]);

  // Cleanup on unmount
  useEffect(() => () => { clearTimer(); clearIntTimer(); }, [clearTimer, clearIntTimer]);

  // ── Computed values ──
  const isInterval = mode === 'intervals';

  // Standard timer progress
  const progress = totalSeconds > 0 ? remaining / totalSeconds : 0;
  const progressPct = Math.round(progress * 100);
  let timerColor = '#4caf50';
  if (progress <= 0.25) timerColor = '#e91e63';
  else if (progress <= 0.5) timerColor = '#ffea09';
  if (status === 'finished') timerColor = '#e91e63';

  // Interval progress
  const intProgress = intPhaseDuration > 0 ? intRemaining / intPhaseDuration : 0;
  const intProgressPct = Math.round(intProgress * 100);
  const intColor = intPhase === 'work' ? '#4caf50' : '#2196f3';
  const intDisplayColor = intStatus === 'finished' ? '#e91e63' : intColor;

  // Choose which values to use for the ring
  const activeRemaining = isInterval ? intRemaining : remaining;
  const activeProgress = isInterval ? intProgress : progress;
  const activeColor = isInterval ? intDisplayColor : timerColor;
  const activeStatus = isInterval ? intStatus : status;

  // SVG progress ring params
  const ringSize = fullscreen ? 320 : 200;
  const strokeWidth = fullscreen ? 10 : 8;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - activeProgress);

  // ── Mode toggle handler ──
  const switchMode = (m: TimerMode) => {
    if (m === mode) return;
    // Reset both timers when switching
    clearTimer();
    clearIntTimer();
    setStatus('idle');
    setIntStatus('idle');
    setRemaining(totalSeconds);
    const workSecs = intWorkMin * 60;
    setIntCurrentRound(1);
    setIntPhase('work');
    setIntRemaining(workSecs);
    setIntPhaseDuration(workSecs);
    beeped.current = false;
    setMode(m);
  };

  // ── Fullscreen view ──
  if (fullscreen) {
    return (
      <div className="panel timer-panel" style={{ overflow: 'auto', padding: '16px', flex: 1 }}>
        <style>{TIMER_INTERVAL_STYLES}</style>
        <div className="timer-fullscreen-overlay">
          <button
            className="btn timer-exit-fs"
            onClick={() => setFullscreen(false)}
            title="Zamknij pełny ekran"
          >
            &times;
          </button>

          {isInterval && activeStatus !== 'idle' && (
            <div className="timer-int-phase-badge" style={{ background: intDisplayColor }}>
              {intPhase === 'work' ? '🔨 Praca' : '☕ Przerwa'} — Runda {intCurrentRound}/{intRounds}
            </div>
          )}

          <div className="timer-ring-wrap" style={{ width: ringSize, height: ringSize }}>
            <svg width={ringSize} height={ringSize} className="timer-ring-svg">
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={strokeWidth}
              />
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                fill="none"
                stroke={activeColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{
                  transform: 'rotate(-90deg)',
                  transformOrigin: '50% 50%',
                  transition: 'stroke-dashoffset 0.4s linear, stroke 0.3s',
                }}
              />
            </svg>
            <div className="timer-ring-label" style={{ color: activeColor, fontSize: 72 }}>
              {formatTime(activeRemaining)}
            </div>
          </div>

          {activeStatus === 'finished' && (
            <div className="timer-finished-label">
              {isInterval ? 'Wszystkie rundy zakończone!' : 'Czas minął!'}
            </div>
          )}

          <div className="timer-controls" style={{ marginTop: 32 }}>
            {!isInterval && (
              <>
                {status === 'idle' && (
                  <button className="btn primary" onClick={handleStart}>Start</button>
                )}
                {status === 'running' && (
                  <button className="btn" onClick={handlePause}>Pauza</button>
                )}
                {status === 'paused' && (
                  <>
                    <button className="btn primary" onClick={handleResume}>Wznów</button>
                    <button className="btn" onClick={handleReset}>Reset</button>
                  </>
                )}
                {status === 'finished' && (
                  <button className="btn" onClick={handleReset}>Reset</button>
                )}
              </>
            )}
            {isInterval && (
              <>
                {intStatus === 'idle' && (
                  <button className="btn primary" onClick={intStart}>Start</button>
                )}
                {intStatus === 'running' && (
                  <button className="btn" onClick={intPause}>Pauza</button>
                )}
                {intStatus === 'paused' && (
                  <>
                    <button className="btn primary" onClick={intResume}>Wznów</button>
                    <button className="btn" onClick={intReset}>Reset</button>
                  </>
                )}
                {intStatus === 'finished' && (
                  <button className="btn" onClick={intReset}>Reset</button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Normal view ──
  return (
    <div className="panel timer-panel" style={{ overflow: 'auto', padding: '16px', flex: 1 }}>
      <style>{TIMER_INTERVAL_STYLES}</style>

      {/* Mode toggle */}
      <div className="timer-mode-toggle">
        <button
          className={`btn timer-mode-btn${mode === 'timer' ? ' active' : ''}`}
          onClick={() => switchMode('timer')}
        >
          ⏱️ Timer
        </button>
        <button
          className={`btn timer-mode-btn${mode === 'intervals' ? ' active' : ''}`}
          onClick={() => switchMode('intervals')}
        >
          🔄 Interwały
        </button>
      </div>

      {/* Standard timer config */}
      {!isInterval && (
        <div className="timer-section">
          <div className="timer-section-title">Czas</div>
          <div className="timer-presets">
            {PRESETS.map((m) => (
              <button
                key={m}
                className={`btn timer-preset-btn${totalSeconds === m * 60 && status === 'idle' ? ' active' : ''}`}
                onClick={() => selectPreset(m)}
                disabled={status === 'running'}
              >
                {m} min
              </button>
            ))}
            <div className="timer-custom-row">
              <input
                type="number"
                className="timer-custom-input"
                placeholder="min"
                min={1}
                max={180}
                value={customMin}
                onChange={(e) => setCustomMin(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCustom()}
                disabled={status === 'running'}
              />
              <button
                className="btn"
                onClick={handleCustom}
                disabled={status === 'running' || !customMin}
              >
                Ustaw
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interval config */}
      {isInterval && (
        <div className="timer-section">
          <div className="timer-section-title">Ustawienia interwałów</div>
          <div className="timer-int-config">
            <div className="timer-int-config-row">
              <label className="timer-int-label">🔨 Praca:</label>
              <input
                type="number"
                className="timer-int-input"
                min={1}
                max={120}
                value={intWorkMin}
                onChange={(e) => {
                  const v = Math.max(1, Math.min(120, parseInt(e.target.value) || 1));
                  setIntWorkMin(v);
                  if (intStatus === 'idle') {
                    setIntRemaining(v * 60);
                    setIntPhaseDuration(v * 60);
                  }
                }}
                disabled={intStatus === 'running'}
              />
              <span className="timer-int-unit">min</span>
            </div>
            <div className="timer-int-config-row">
              <label className="timer-int-label">☕ Przerwa:</label>
              <input
                type="number"
                className="timer-int-input"
                min={1}
                max={60}
                value={intBreakMin}
                onChange={(e) => {
                  const v = Math.max(1, Math.min(60, parseInt(e.target.value) || 1));
                  setIntBreakMin(v);
                }}
                disabled={intStatus === 'running'}
              />
              <span className="timer-int-unit">min</span>
            </div>
            <div className="timer-int-config-row">
              <label className="timer-int-label">🔁 Rundy:</label>
              <input
                type="number"
                className="timer-int-input"
                min={1}
                max={20}
                value={intRounds}
                onChange={(e) => {
                  const v = Math.max(1, Math.min(20, parseInt(e.target.value) || 1));
                  setIntRounds(v);
                }}
                disabled={intStatus === 'running'}
              />
            </div>
          </div>
        </div>
      )}

      {/* Phase indicator for intervals */}
      {isInterval && intStatus !== 'idle' && (
        <div className="timer-int-phase-bar" style={{ background: `${intDisplayColor}22`, borderColor: intDisplayColor }}>
          <span className="timer-int-phase-label" style={{ color: intDisplayColor }}>
            {intPhase === 'work' ? '🔨 Praca' : '☕ Przerwa'}
          </span>
          <span className="timer-int-round-label">
            Runda {intCurrentRound}/{intRounds}
          </span>
        </div>
      )}

      {/* Display */}
      <div className="timer-display-area">
        <div className="timer-ring-wrap" style={{ width: ringSize, height: ringSize }}>
          <svg width={ringSize} height={ringSize} className="timer-ring-svg">
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={strokeWidth}
            />
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              fill="none"
              stroke={activeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{
                transform: 'rotate(-90deg)',
                transformOrigin: '50% 50%',
                transition: 'stroke-dashoffset 0.4s linear, stroke 0.3s',
              }}
            />
          </svg>
          <div className="timer-ring-label" style={{ color: activeColor }}>
            {formatTime(activeRemaining)}
          </div>
        </div>

        {activeStatus === 'finished' && (
          <div className="timer-finished-label">
            {isInterval ? 'Wszystkie rundy zakończone!' : 'Czas minął!'}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="timer-progress-bar-wrap">
        <div
          className="timer-progress-bar"
          style={{ width: `${isInterval ? intProgressPct : progressPct}%`, background: activeColor }}
        />
      </div>

      {/* Round dots for intervals */}
      {isInterval && intStatus !== 'idle' && (
        <div className="timer-int-round-dots">
          {Array.from({ length: intRounds }, (_, i) => {
            const roundNum = i + 1;
            let dotColor = 'rgba(255,255,255,0.1)';
            if (roundNum < intCurrentRound) dotColor = '#4caf50';
            else if (roundNum === intCurrentRound) dotColor = intDisplayColor;
            return (
              <div
                key={i}
                className={`timer-int-dot${roundNum === intCurrentRound ? ' current' : ''}`}
                style={{ background: dotColor }}
                title={`Runda ${roundNum}`}
              />
            );
          })}
        </div>
      )}

      {/* Controls */}
      <div className="timer-controls">
        {!isInterval && (
          <>
            {status === 'idle' && (
              <button className="btn primary" onClick={handleStart} disabled={totalSeconds <= 0}>
                Start
              </button>
            )}
            {status === 'running' && (
              <button className="btn" onClick={handlePause}>Pauza</button>
            )}
            {status === 'paused' && (
              <>
                <button className="btn primary" onClick={handleResume}>Wznów</button>
                <button className="btn" onClick={handleReset}>Reset</button>
              </>
            )}
            {status === 'finished' && (
              <button className="btn" onClick={handleReset}>Reset</button>
            )}
          </>
        )}
        {isInterval && (
          <>
            {intStatus === 'idle' && (
              <button className="btn primary" onClick={intStart}>
                Start
              </button>
            )}
            {intStatus === 'running' && (
              <button className="btn" onClick={intPause}>Pauza</button>
            )}
            {intStatus === 'paused' && (
              <>
                <button className="btn primary" onClick={intResume}>Wznów</button>
                <button className="btn" onClick={intReset}>Reset</button>
              </>
            )}
            {intStatus === 'finished' && (
              <button className="btn" onClick={intReset}>Reset</button>
            )}
          </>
        )}
        <button
          className="btn timer-fs-btn"
          onClick={() => setFullscreen(true)}
          title="Pełny ekran"
        >
          ⛶
        </button>
      </div>

      {/* Info */}
      <div className="timer-info">
        {!isInterval && (
          <>
            {status === 'idle' && <span>Wybierz czas i naciśnij Start</span>}
            {status === 'running' && <span>Odliczam...</span>}
            {status === 'paused' && <span>Zatrzymano — {formatTime(remaining)} zostało</span>}
            {status === 'finished' && <span>Koniec! Czas minął.</span>}
          </>
        )}
        {isInterval && (
          <>
            {intStatus === 'idle' && <span>Ustaw interwały i naciśnij Start</span>}
            {intStatus === 'running' && (
              <span>
                {intPhase === 'work' ? 'Pracujesz' : 'Odpoczywasz'} — runda {intCurrentRound}/{intRounds}
              </span>
            )}
            {intStatus === 'paused' && (
              <span>Pauza — {formatTime(intRemaining)} zostało ({intPhase === 'work' ? 'praca' : 'przerwa'})</span>
            )}
            {intStatus === 'finished' && <span>Ukończono wszystkie {intRounds} rund!</span>}
          </>
        )}
      </div>
    </div>
  );
}

// ── Scoped styles for interval mode ─────────────────────────────────────────
const TIMER_INTERVAL_STYLES = `
.timer-mode-toggle {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
}
.timer-mode-btn {
  flex: 1;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  background: var(--input-bg);
  color: var(--txt-muted);
  transition: all 0.2s;
  border: 2px solid transparent;
}
.timer-mode-btn.active {
  background: rgba(233, 30, 99, 0.15);
  color: var(--accent);
  border-color: var(--accent);
}
.timer-mode-btn:hover:not(.active) {
  background: rgba(255,255,255,0.08);
}
.timer-int-config {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px 0;
}
.timer-int-config-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.timer-int-label {
  font-size: 13px;
  color: var(--txt-muted);
  min-width: 90px;
}
.timer-int-input {
  width: 60px;
  padding: 6px 8px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.1);
  background: var(--input-bg);
  color: var(--txt-main);
  font-size: 14px;
  text-align: center;
  outline: none;
}
.timer-int-input:focus {
  border-color: var(--accent);
}
.timer-int-unit {
  font-size: 12px;
  color: var(--txt-muted);
}
.timer-int-phase-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 14px;
  border-radius: 10px;
  border: 2px solid;
  margin-bottom: 12px;
}
.timer-int-phase-label {
  font-weight: 700;
  font-size: 15px;
}
.timer-int-round-label {
  font-size: 13px;
  color: var(--txt-muted);
  font-weight: 600;
}
.timer-int-phase-badge {
  padding: 8px 20px;
  border-radius: 24px;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 16px;
}
.timer-int-round-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin: 8px 0;
}
.timer-int-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  transition: all 0.3s;
}
.timer-int-dot.current {
  box-shadow: 0 0 8px rgba(255,255,255,0.3);
  transform: scale(1.2);
}
`;
