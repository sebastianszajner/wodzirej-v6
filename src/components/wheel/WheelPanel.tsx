import { useRef, useEffect, useCallback, useState } from 'react';
import { useStore } from '../../store';
import type { Participant } from '../../store/types';

// ── Colour palette for wheel segments ─────────────────────────────────────
const COLORS = [
  ['#e91e63', '#fff'],
  ['#ffea09', '#000'],
  ['#00bcd4', '#fff'],
  ['#ff9800', '#000'],
  ['#9c27b0', '#fff'],
  ['#4caf50', '#fff'],
  ['#f44336', '#fff'],
  ['#2196f3', '#fff'],
];

const DEMO_NAMES = ['Dodaj osoby', 'Wrzut Excel', 'Wklej CSV', 'Losuj!', 'Grupy', 'Tryb Sali'];

interface WinnerState {
  participant: Participant;
}

export function WheelPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number | null>(null);
  const failRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  const participants = useStore((s) => s.participants);
  const wheelPool    = useStore((s) => s.wheelPool);
  const wheelMode    = useStore((s) => s.wheelMode);
  const setWheelMode = useStore((s) => s.setWheelMode);
  const resetPool    = useStore((s) => s.resetWheelPool);
  const removeFromPool = useStore((s) => s.removeFromPool);
  const showToast    = useStore((s) => s.showToast);

  const [isSpinning, setIsSpinning] = useState(false);
  const [angle, setAngle]           = useState(0);
  const [winner, setWinner]         = useState<WinnerState | null>(null);

  const angleRef     = useRef(0);
  const isSpinRef    = useRef(false);

  const isDemoMode = participants.length < 2;
  const items: Participant[] = isDemoMode
    ? DEMO_NAMES.map((n, i) => ({ id: String(i), first: n, last: '', text: n }))
    : (wheelPool.length >= 2 ? wheelPool : participants);

  // ── Draw ──────────────────────────────────────────────────────────────────
  const draw = useCallback((currentAngle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const r  = Math.min(cx, cy) - 10;
    ctx.clearRect(0, 0, W, H);

    const len  = items.length;
    const step = (Math.PI * 2) / len;

    // Font size adaptive for 30 segments
    const arcLen   = (2 * Math.PI * r) / len;
    const fontSize = Math.max(9, Math.min(26, arcLen / 3.0));
    const showLast = len < 20 && !isDemoMode;
    const maxChars = len >= 24 ? 7 : len >= 18 ? 11 : 999;

    const trunc = (s: string) => s.length > maxChars ? s.slice(0, maxChars - 1) + '…' : s;

    for (let i = 0; i < len; i++) {
      const p = items[i];
      const [bg, fg] = isDemoMode ? ['#444', '#999'] : COLORS[i % COLORS.length];
      const a = currentAngle + i * step;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, a, a + step);
      ctx.fillStyle = bg;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(a + step / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = fg;

      const fn = trunc(p.first || p.text || '?');
      const ln = trunc(p.last || '');

      if (ln && showLast) {
        ctx.font = `800 ${fontSize}px sans-serif`;
        ctx.fillText(fn, r - 14, -fontSize * 0.12);
        ctx.font = `400 ${fontSize * 0.78}px sans-serif`;
        ctx.fillText(ln, r - 14, fontSize * 0.84);
      } else {
        ctx.font = `800 ${fontSize}px sans-serif`;
        ctx.fillText(fn, r - 14, fontSize / 3);
      }

      ctx.restore();
    }

    // Centre hub
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.14, 0, Math.PI * 2);
    ctx.fillStyle = isDemoMode ? '#222' : '#fff';
    ctx.fill();
  }, [items, isDemoMode]);

  // ── Resize canvas ─────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const ro = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      const { width, height } = parent.getBoundingClientRect();
      const size = Math.floor(Math.min(width, height) * 0.96);
      canvas.width  = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width  = size + 'px';
      canvas.style.height = size + 'px';
      const ctx = canvas.getContext('2d');
      ctx?.setTransform(1, 0, 0, 1, 0, 0);
      ctx?.scale(dpr, dpr);
      draw(angleRef.current);
    });
    ro.observe(parent);
    return () => ro.disconnect();
  }, [draw]);

  // Redraw on items or angle change
  useEffect(() => { draw(angleRef.current); }, [draw, angle]);

  // ── Force stop ────────────────────────────────────────────────────────────
  const forceStop = useCallback(() => {
    if (rafRef.current)  { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (failRef.current) { clearTimeout(failRef.current); failRef.current = null; }
    isSpinRef.current = false;
    setIsSpinning(false);
  }, []);

  // ESC closes modal / stops spin
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setWinner(null); forceStop(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [forceStop]);

  // ── Spin ──────────────────────────────────────────────────────────────────
  const spin = useCallback(() => {
    if (isSpinRef.current) return;
    if (isDemoMode || items.length < 2) {
      showToast('Dodaj minimum 2 uczestników', 'error');
      return;
    }

    isSpinRef.current = true;
    setIsSpinning(true);
    setWinner(null);

    let vel = 0.48 + Math.random() * 0.28;

    // Failsafe: after 16 s force-finish
    failRef.current = setTimeout(() => {
      const idx = Math.floor(Math.random() * items.length);
      finish(idx);
    }, 16000);

    function finish(idx: number) {
      if (rafRef.current)  { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      if (failRef.current) { clearTimeout(failRef.current); failRef.current = null; }
      isSpinRef.current = false;
      setIsSpinning(false);

      const w = items[idx];
      if (!w) { showToast('Błąd losowania — spróbuj ponownie', 'error'); return; }

      setWinner({ participant: w });

      if (wheelMode === 'pickRemove') {
        removeFromPool(w.id);
      }
    }

    function loop() {
      angleRef.current += vel;
      vel *= 0.991;

      // Sound-tick placeholder (no audio dep)
      setAngle(angleRef.current); // triggers redraw

      if (vel < 0.002) {
        // Determine winner index
        const len      = items.length;
        const step     = (Math.PI * 2) / len;
        const norm     = ((angleRef.current % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const pointer  = (Math.PI * 1.5 + Math.PI * 2 - norm) % (Math.PI * 2);
        const idx      = Math.floor(pointer / step) % len;
        finish(idx);
        return;
      }

      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
  }, [isDemoMode, items, wheelMode, removeFromPool, showToast]);

  const closeWinner = () => setWinner(null);

  const spinAgain = () => {
    setWinner(null);
    setTimeout(spin, 400);
  };

  return (
    <div className="wheel-panel">
      {/* Controls */}
      <div className="wheel-controls">
        <button
          className="btn primary"
          onClick={spin}
          disabled={isSpinning || isDemoMode}
          style={{ fontSize: 15, padding: '9px 24px' }}
        >
          {isSpinning ? '⏳ Losowanie…' : '🎡 ZAKRĘĆ (W)'}
        </button>

        <select
          value={wheelMode}
          onChange={(e) => setWheelMode(e.target.value as 'pick' | 'pickRemove')}
          style={{
            background: 'var(--input-bg)', border: '1px solid var(--line)',
            color: 'var(--txt-main)', borderRadius: 7, padding: '6px 10px',
          }}
        >
          <option value="pick">Wylosuj (zostaw)</option>
          <option value="pickRemove">Wylosuj i usuń</option>
        </select>

        {wheelMode === 'pickRemove' && wheelPool.length < participants.length && (
          <button className="btn sm" onClick={resetPool}>↺ Reset puli</button>
        )}

        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--txt-muted)' }}>
          {isDemoMode ? 'DEMO — dodaj uczestników' : `${items.length} na kole`}
        </span>
      </div>

      {/* Canvas stage */}
      <div className="wheel-stage">
        <canvas ref={canvasRef} />
        <div className="wheel-pointer" />
      </div>

      {/* Pool info */}
      {wheelMode === 'pickRemove' && !isDemoMode && (
        <div className="pool-info">
          Pula: {wheelPool.length} z {participants.length} — klawisz W = zakręć • ESC = zamknij
        </div>
      )}

      {/* Winner modal */}
      {winner && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && closeWinner()}>
          <div className="podium">
            <button className="btn sm danger close-btn" onClick={closeWinner}>✕ ESC</button>
            <div className="label">🏆 Wylosowano</div>
            <div className="winner-name">{winner.participant.first}</div>
            {winner.participant.last && (
              <div className="winner-last">{winner.participant.last}</div>
            )}
            <div className="podium-actions">
              {wheelMode === 'pickRemove' && wheelPool.length >= 2 && (
                <button className="btn primary" onClick={spinAgain}>Losuj następną</button>
              )}
              <button className="btn" onClick={closeWinner}>Zamknij</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
