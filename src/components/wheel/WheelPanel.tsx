import { useRef, useEffect, useCallback, useState } from 'react';
import { useStore } from '../../store';
import { canonicalFirst } from '../../logic/nicknames';
import type { Participant } from '../../store/types';

// ── Colour palette ────────────────────────────────────────────────────────────
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

interface WinnerState { participant: Participant; }

// ── Web Audio helpers ─────────────────────────────────────────────────────────
let _ac: AudioContext | null = null;
function getAC(): AudioContext {
  if (!_ac) _ac = new (window.AudioContext || (window as any).webkitAudioContext)();
  return _ac;
}

/** Pojedynczy klik/tik – krótki sinusoid burst */
function playTick(freq = 880, dur = 0.025, vol = 0.18) {
  try {
    const ac = getAC();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain); gain.connect(ac.destination);
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(vol, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
    osc.start(); osc.stop(ac.currentTime + dur);
  } catch {}
}

/** Fanfara na zwycięzcę – akord + sweep */
function playFanfare() {
  try {
    const ac = getAC();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const osc  = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain); gain.connect(ac.destination);
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const t = ac.currentTime + i * 0.1;
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.22, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      osc.start(t); osc.stop(t + 0.5);
    });
  } catch {}
}

// ── Confetti particle ─────────────────────────────────────────────────────────
interface Confetto {
  x: number; y: number; vx: number; vy: number;
  rot: number; vrot: number;
  w: number; h: number; color: string; life: number;
}

function spawnConfetti(cx: number, cy: number): Confetto[] {
  const palette = ['#e91e63','#ffea09','#00bcd4','#ff9800','#9c27b0','#4caf50','#fff'];
  return Array.from({ length: 120 }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 8;
    return {
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 6,
      rot: Math.random() * Math.PI,
      vrot: (Math.random() - 0.5) * 0.3,
      w: 6 + Math.random() * 8,
      h: 3 + Math.random() * 5,
      color: palette[Math.floor(Math.random() * palette.length)],
      life: 1,
    };
  });
}

export function WheelPanel() {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const confCanRef   = useRef<HTMLCanvasElement>(null);  // osobny canvas na confetti
  const rafRef       = useRef<number | null>(null);
  const confRafRef   = useRef<number | null>(null);
  const failRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confettiRef  = useRef<Confetto[]>([]);
  const lastTickAngle = useRef(0);

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
  const [glowActive, setGlowActive] = useState(false);

  const angleRef  = useRef(0);
  const isSpinRef = useRef(false);

  const isDemoMode = participants.length < 2;
  const items: Participant[] = isDemoMode
    ? DEMO_NAMES.map((n, i) => ({ id: String(i), first: n, last: '', text: n }))
    : (wheelPool.length >= 2 ? wheelPool : participants);

  // Buduj mapę kolizji imion w CAŁEJ liście uczestników
  const canonCounts = new Map<string, number>();
  for (const p of participants) {
    const c = canonicalFirst(p.first || p.text || '');
    canonCounts.set(c, (canonCounts.get(c) ?? 0) + 1);
  }
  function itemLabel(p: Participant): { fn: string; ln: string } {
    const fn  = p.first || p.text || '?';
    const ln  = p.last  || '';
    const c   = canonicalFirst(fn);
    const col = (canonCounts.get(c) ?? 0) >= 2;
    return { fn, ln: col && ln ? ln[0].toUpperCase() + '.' : '' };
  }

  // ── Draw wheel ──────────────────────────────────────────────────────────────
  const draw = useCallback((currentAngle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const r  = Math.min(cx, cy) - 10;
    ctx.clearRect(0, 0, W, H);

    const len  = items.length;
    const step = (Math.PI * 2) / len;

    const arcLen   = (2 * Math.PI * r) / len;
    const fontSize = Math.max(9, Math.min(26, arcLen / 3.0));
    const showLast = !isDemoMode;
    const maxChars = len >= 24 ? 7 : len >= 18 ? 11 : 999;
    const trunc    = (s: string) => s.length > maxChars ? s.slice(0, maxChars - 1) + '…' : s;

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

      const { fn: rawFn, ln: rawLn } = isDemoMode ? { fn: p.text || p.first || '?', ln: '' } : itemLabel(p);
      const fn = trunc(rawFn);
      const ln = trunc(rawLn);

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

    // Hub
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.14, 0, Math.PI * 2);
    ctx.fillStyle = isDemoMode ? '#222' : '#fff';
    ctx.fill();
  }, [items, isDemoMode, canonCounts]);

  // ── Confetti loop ───────────────────────────────────────────────────────────
  const startConfetti = useCallback((cx: number, cy: number) => {
    confettiRef.current = spawnConfetti(cx, cy);

    const animate = () => {
      const canvas = confCanRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const alive: Confetto[] = [];
      for (const c of confettiRef.current) {
        c.x   += c.vx;
        c.y   += c.vy;
        c.vy  += 0.35;      // gravity
        c.vx  *= 0.98;
        c.rot += c.vrot;
        c.life -= 0.013;
        if (c.life <= 0) continue;
        ctx.save();
        ctx.globalAlpha = Math.max(0, c.life);
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rot);
        ctx.fillStyle = c.color;
        ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
        ctx.restore();
        alive.push(c);
      }
      confettiRef.current = alive;
      if (alive.length > 0) confRafRef.current = requestAnimationFrame(animate);
    };

    if (confRafRef.current) cancelAnimationFrame(confRafRef.current);
    confRafRef.current = requestAnimationFrame(animate);
  }, []);

  // ── Resize canvas ───────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const confCanvas = confCanRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const ro = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      const { width, height } = parent.getBoundingClientRect();
      const size = Math.floor(Math.min(width, height) * 0.96);

      for (const c of [canvas, confCanvas]) {
        if (!c) continue;
        c.width  = size * dpr;
        c.height = size * dpr;
        c.style.width  = size + 'px';
        c.style.height = size + 'px';
        const ctx = c.getContext('2d');
        ctx?.setTransform(1, 0, 0, 1, 0, 0);
        ctx?.scale(dpr, dpr);
      }
      draw(angleRef.current);
    });
    ro.observe(parent);
    return () => ro.disconnect();
  }, [draw]);

  useEffect(() => { draw(angleRef.current); }, [draw, angle]);

  // ── Force stop ──────────────────────────────────────────────────────────────
  const forceStop = useCallback(() => {
    if (rafRef.current)  { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (failRef.current) { clearTimeout(failRef.current); failRef.current = null; }
    isSpinRef.current = false;
    setIsSpinning(false);
    setGlowActive(false);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setWinner(null); forceStop(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [forceStop]);

  // ── Spin ────────────────────────────────────────────────────────────────────
  const spin = useCallback(() => {
    if (isSpinRef.current) return;
    if (isDemoMode || items.length < 2) {
      showToast('Dodaj minimum 2 uczestników', 'error');
      return;
    }

    // Unlock AudioContext (must happen in user gesture)
    try { getAC().resume(); } catch {}

    isSpinRef.current = true;
    setIsSpinning(true);
    setGlowActive(true);
    setWinner(null);
    lastTickAngle.current = angleRef.current;

    let vel = 0.48 + Math.random() * 0.28;
    const segStep = (Math.PI * 2) / items.length;

    failRef.current = setTimeout(() => {
      const idx = Math.floor(Math.random() * items.length);
      finish(idx);
    }, 16000);

    function finish(idx: number) {
      if (rafRef.current)  { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      if (failRef.current) { clearTimeout(failRef.current); failRef.current = null; }
      isSpinRef.current = false;
      setIsSpinning(false);
      setGlowActive(false);

      const w = items[idx];
      if (!w) { showToast('Błąd losowania — spróbuj ponownie', 'error'); return; }

      // Fanfara
      playFanfare();

      // Confetti ze środka koła
      const canvas = canvasRef.current;
      if (canvas) {
        const dpr = window.devicePixelRatio || 1;
        const cx = canvas.width / dpr / 2;
        const cy = canvas.height / dpr / 2;
        startConfetti(cx, cy);
      }

      setWinner({ participant: w });

      if (wheelMode === 'pickRemove') removeFromPool(w.id);
    }

    function loop() {
      angleRef.current += vel;
      vel *= 0.991;

      // Tick przy przekroczeniu granicy segmentu
      const delta = angleRef.current - lastTickAngle.current;
      if (Math.abs(delta) >= segStep) {
        lastTickAngle.current = angleRef.current;
        // głośność tiku rośnie wraz z prędkością
        const vol = Math.min(0.35, vel * 0.7);
        const freq = 600 + vel * 300;
        playTick(freq, 0.025, vol);
      }

      setAngle(angleRef.current);

      if (vel < 0.002) {
        const len     = items.length;
        const step    = (Math.PI * 2) / len;
        const norm    = ((angleRef.current % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const pointer = (Math.PI * 2 - norm) % (Math.PI * 2);
        const idx     = Math.floor(pointer / step) % len;
        finish(idx);
        return;
      }

      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
  }, [isDemoMode, items, wheelMode, removeFromPool, showToast, startConfetti]);

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
        {/* Wheel canvas */}
        <canvas ref={canvasRef} style={{ position: 'absolute' }} />
        {/* Confetti canvas (nad kołem) */}
        <canvas ref={confCanRef} style={{ position: 'absolute', pointerEvents: 'none', zIndex: 3 }} />
        {/* Pointer */}
        <div
          className="wheel-pointer"
          style={glowActive ? {
            filter: 'drop-shadow(0 0 10px #ffea09) drop-shadow(0 0 20px #ffea09)',
            transition: 'filter 0.2s',
          } : { transition: 'filter 0.4s' }}
        />
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
          <div className="podium winner-pop">
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
