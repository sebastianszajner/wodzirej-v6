import { useState, useRef, useCallback, useEffect } from 'react';
import { FullscreenButton } from '../ui/FullscreenButton';

// ── Helpers ──────────────────────────────────────────────────────────────────
function levelColor(pct: number): string {
  if (pct < 30) return '#4caf50';
  if (pct < 70) return '#ffea09';
  return '#e53935';
}

function levelLabel(pct: number): string {
  if (pct < 30) return 'Cicho';
  if (pct < 70) return 'Umiarkowanie';
  return 'Głośno!';
}

// ── Component ────────────────────────────────────────────────────────────────
export function NoisePanel() {
  const panelRef = useRef<HTMLDivElement>(null);
  const [listening, setListening] = useState(false);
  const [volume, setVolume] = useState(0);          // 0-100
  const [peak, setPeak] = useState(0);
  const [threshold, setThreshold] = useState(70);    // 0-100
  const [alert, setAlert] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bouncyMode, setBouncyMode] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number>(0);
  const alertTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Bouncy balls state
  const [balls, setBalls] = useState<{ id: number; x: number; hue: number }[]>([]);
  const ballsInitialized = useRef(false);

  useEffect(() => {
    if (!ballsInitialized.current) {
      const initial = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        x: 8 + (i * 84) / 12 + Math.random() * 4,
        hue: (i * 30) % 360,
      }));
      setBalls(initial);
      ballsInitialized.current = true;
    }
  }, []);

  // ── Audio loop ────────────────────────────────────────────
  const tick = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    const data = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(data);

    // RMS volume
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / data.length);
    const pct = Math.min(100, Math.round(rms * 400)); // scale to 0-100

    setVolume(pct);
    setPeak((prev) => Math.max(prev, pct));

    // Alert flash
    if (pct > threshold) {
      setAlert(true);
      if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
      alertTimeoutRef.current = setTimeout(() => setAlert(false), 400);
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [threshold]);

  // ── Start / Stop ──────────────────────────────────────────
  const start = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      const audioCtx = new AudioContext();
      ctxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.3;
      source.connect(analyser);
      // NO output connection — no recording, no playback
      analyserRef.current = analyser;

      setListening(true);
      setPeak(0);
      rafRef.current = requestAnimationFrame(tick);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Nie udało się uzyskać dostępu do mikrofonu.';
      setError(msg);
    }
  };

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    ctxRef.current?.close();
    ctxRef.current = null;
    analyserRef.current = null;

    setListening(false);
    setVolume(0);
    setAlert(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      ctxRef.current?.close();
    };
  }, []);

  // ── Gauge geometry ────────────────────────────────────────
  const gaugeSize = 200;
  const gaugeR = 80;
  const gaugeStroke = 14;
  const circumference = Math.PI * gaugeR; // half-circle
  const fillPct = volume / 100;
  const dashOffset = circumference * (1 - fillPct);
  const color = levelColor(volume);

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="panel noise-panel" ref={panelRef} style={{ overflow: 'auto', padding: '16px', flex: 1 }}>
      {/* Fullscreen */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <FullscreenButton targetRef={panelRef} />
      </div>
      {/* Error */}
      {error && (
        <div
          style={{
            background: 'rgba(229,57,53,0.12)',
            border: '1px solid rgba(229,57,53,0.3)',
            borderRadius: 'var(--radius)',
            padding: '10px 14px',
            marginBottom: 16,
            color: '#e53935',
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {/* Mode toggle */}
      <div
        style={{
          display: 'flex',
          gap: 0,
          marginBottom: 16,
          background: 'var(--input-bg)',
          borderRadius: 'var(--radius)',
          padding: 3,
        }}
      >
        {[false, true].map((isBouncy) => (
          <button
            key={String(isBouncy)}
            onClick={() => setBouncyMode(isBouncy)}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              borderRadius: 'calc(var(--radius) - 2px)',
              background: bouncyMode === isBouncy ? 'var(--accent)' : 'transparent',
              color: bouncyMode === isBouncy ? '#fff' : 'var(--txt-muted)',
              fontWeight: bouncyMode === isBouncy ? 700 : 400,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {isBouncy ? 'Piłeczki' : 'Gauge'}
          </button>
        ))}
      </div>

      {/* ── GAUGE visualization ────────────────────────────── */}
      {!bouncyMode && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              position: 'relative',
              width: gaugeSize,
              height: gaugeSize / 2 + 30,
              transition: 'filter 0.15s',
              filter: alert ? 'brightness(1.4) drop-shadow(0 0 20px rgba(229,57,53,0.7))' : 'none',
            }}
          >
            <svg
              width={gaugeSize}
              height={gaugeSize / 2 + 20}
              viewBox={`0 0 ${gaugeSize} ${gaugeSize / 2 + 20}`}
            >
              {/* Background arc */}
              <path
                d={`M ${gaugeSize / 2 - gaugeR} ${gaugeSize / 2 + 10}
                    A ${gaugeR} ${gaugeR} 0 0 1 ${gaugeSize / 2 + gaugeR} ${gaugeSize / 2 + 10}`}
                fill="none"
                stroke="var(--input-bg)"
                strokeWidth={gaugeStroke}
                strokeLinecap="round"
              />

              {/* Fill arc */}
              <path
                d={`M ${gaugeSize / 2 - gaugeR} ${gaugeSize / 2 + 10}
                    A ${gaugeR} ${gaugeR} 0 0 1 ${gaugeSize / 2 + gaugeR} ${gaugeSize / 2 + 10}`}
                fill="none"
                stroke={color}
                strokeWidth={gaugeStroke}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 0.1s ease, stroke 0.2s ease' }}
              />

              {/* Threshold marker */}
              {listening && (
                <circle
                  cx={gaugeSize / 2 - gaugeR * Math.cos(Math.PI * (threshold / 100))}
                  cy={gaugeSize / 2 + 10 - gaugeR * Math.sin(Math.PI * (threshold / 100))}
                  r={4}
                  fill="#e91e63"
                  stroke="#0f0f13"
                  strokeWidth={2}
                />
              )}
            </svg>

            {/* Center text */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 36, fontWeight: 800, color, lineHeight: 1 }}>
                {listening ? volume : '--'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--txt-muted)', marginTop: 2 }}>
                {listening ? levelLabel(volume) : 'Nieaktywny'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── BOUNCY BALLS visualization ─────────────────────── */}
      {bouncyMode && (
        <div
          style={{
            height: 180,
            background: alert ? 'rgba(229,57,53,0.08)' : 'var(--input-bg)',
            borderRadius: 'var(--radius)',
            marginBottom: 20,
            position: 'relative',
            overflow: 'hidden',
            transition: 'background 0.2s',
          }}
        >
          {balls.map((ball) => {
            const bounce = listening ? Math.min(volume / 100, 1) : 0;
            const y = 160 - bounce * 140 - Math.random() * bounce * 10;
            const size = 12 + bounce * 6;
            return (
              <div
                key={ball.id}
                style={{
                  position: 'absolute',
                  left: `${ball.x}%`,
                  bottom: `${Math.max(4, 100 - (y / 180) * 100)}%`,
                  width: size,
                  height: size,
                  borderRadius: '50%',
                  background: `hsl(${ball.hue}, 70%, ${50 + bounce * 15}%)`,
                  boxShadow: bounce > 0.5 ? `0 0 8px hsl(${ball.hue}, 70%, 60%)` : 'none',
                  transition: 'bottom 0.12s ease-out, width 0.15s, height 0.15s',
                }}
              />
            );
          })}

          {/* Volume label overlay */}
          <div
            style={{
              position: 'absolute',
              top: 10,
              right: 14,
              fontSize: 28,
              fontWeight: 800,
              color: listening ? color : 'var(--txt-muted)',
              opacity: 0.7,
            }}
          >
            {listening ? volume : '--'}
          </div>
          <div
            style={{
              position: 'absolute',
              top: 42,
              right: 14,
              fontSize: 11,
              color: 'var(--txt-muted)',
            }}
          >
            {listening ? levelLabel(volume) : 'Nieaktywny'}
          </div>
        </div>
      )}

      {/* ── Threshold slider ───────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--txt-muted)' }}>Próg hałasu</span>
          <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}>{threshold}%</span>
        </div>
        <input
          type="range"
          min={10}
          max={95}
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          style={{
            width: '100%',
            accentColor: 'var(--accent)',
            cursor: 'pointer',
          }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 10,
            color: 'var(--txt-muted)',
            marginTop: 2,
          }}
        >
          <span>Wrażliwy</span>
          <span>Tolerancyjny</span>
        </div>
      </div>

      {/* ── Peak / Stats ───────────────────────────────────── */}
      {listening && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 24,
            marginBottom: 20,
            fontSize: 13,
            color: 'var(--txt-muted)',
          }}
        >
          <span>
            Peak: <strong style={{ color: levelColor(peak) }}>{peak}</strong>
          </span>
          <button
            onClick={() => setPeak(0)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--txt-muted)',
              cursor: 'pointer',
              fontSize: 12,
              textDecoration: 'underline',
            }}
          >
            Reset peak
          </button>
        </div>
      )}

      {/* ── Animated volume bars ───────────────────────────── */}
      {listening && (
        <div
          style={{
            display: 'flex',
            gap: 3,
            justifyContent: 'center',
            alignItems: 'flex-end',
            height: 40,
            marginBottom: 20,
          }}
        >
          {Array.from({ length: 20 }, (_, i) => {
            const barPct = ((i + 1) / 20) * 100;
            const active = volume >= barPct;
            const barColor = barPct < 30 ? '#4caf50' : barPct < 70 ? '#ffea09' : '#e53935';
            return (
              <div
                key={i}
                style={{
                  width: 8,
                  height: active ? `${30 + (i / 20) * 70}%` : '10%',
                  background: active ? barColor : 'var(--input-bg)',
                  borderRadius: 2,
                  transition: 'height 0.08s ease, background 0.08s',
                }}
              />
            );
          })}
        </div>
      )}

      {/* ── Start / Stop button ────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          className={listening ? 'btn' : 'btn primary'}
          onClick={listening ? stop : start}
          style={{
            minWidth: 160,
            padding: '12px 24px',
            fontSize: 15,
            fontWeight: 700,
            ...(listening
              ? {
                  border: '1px solid rgba(229,57,53,0.4)',
                  color: '#e53935',
                }
              : {}),
          }}
        >
          {listening ? 'Zatrzymaj' : 'Uruchom mikrofon'}
        </button>
      </div>

      {/* Privacy note */}
      <p
        style={{
          fontSize: 11,
          color: 'var(--txt-muted)',
          textAlign: 'center',
          marginTop: 16,
          opacity: 0.6,
        }}
      >
        Analiza w czasie rzeczywistym. Brak nagrywania. Dane nie opuszczają przeglądarki.
      </p>
    </div>
  );
}
