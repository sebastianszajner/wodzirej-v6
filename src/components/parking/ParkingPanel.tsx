import { useState } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────
type ParkingStatus = 'parked' | 'discussed' | 'rejected';

interface ParkingItem {
  id: string;
  title: string;
  status: ParkingStatus;
  createdAt: number;
}

const STATUS_CYCLE: ParkingStatus[] = ['parked', 'discussed', 'rejected'];

const STATUS_CONFIG: Record<ParkingStatus, { label: string; color: string; bg: string }> = {
  parked:    { label: 'Zaparkowane', color: '#ffea09', bg: 'rgba(255,234,9,0.13)' },
  discussed: { label: 'Omówione',   color: '#4caf50', bg: 'rgba(76,175,80,0.13)' },
  rejected:  { label: 'Odrzucone',  color: '#888',    bg: 'rgba(136,136,136,0.10)' },
};

// ── Helpers ──────────────────────────────────────────────────────────────────
let _id = 0;
const uid = () => `pk-${Date.now()}-${++_id}`;

function fmtTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
}

// ── Component ────────────────────────────────────────────────────────────────
export function ParkingPanel() {
  const [items, setItems] = useState<ParkingItem[]>([]);
  const [draft, setDraft] = useState('');

  // ── Actions ──────────────────────────────────────────────
  const addItem = () => {
    const title = draft.trim();
    if (!title) return;
    setItems((prev) => [
      { id: uid(), title, status: 'parked', createdAt: Date.now() },
      ...prev,
    ]);
    setDraft('');
  };

  const cycleStatus = (id: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const idx = STATUS_CYCLE.indexOf(it.status);
        return { ...it, status: STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length] };
      }),
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const clearAll = () => setItems([]);

  // ── Counts ───────────────────────────────────────────────
  const counts: Record<ParkingStatus, number> = { parked: 0, discussed: 0, rejected: 0 };
  items.forEach((it) => counts[it.status]++);

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="panel parking-panel" style={{ overflow: 'auto', padding: '16px', flex: 1 }}>
      {/* Add form */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          style={{
            flex: 1,
            background: 'var(--input-bg)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius)',
            color: 'var(--txt-main)',
            padding: '10px 14px',
            fontSize: 14,
            outline: 'none',
          }}
          placeholder="Nowy temat / pytanie..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addItem()}
          maxLength={120}
        />
        <button
          className="btn primary"
          onClick={addItem}
          disabled={!draft.trim()}
          style={{ whiteSpace: 'nowrap' }}
        >
          Dodaj
        </button>
      </div>

      {/* Counter bar */}
      {items.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 16,
            fontSize: 13,
            color: 'var(--txt-muted)',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ color: STATUS_CONFIG.parked.color }}>
            {counts.parked} zaparkowane
          </span>
          <span style={{ opacity: 0.4 }}>&middot;</span>
          <span style={{ color: STATUS_CONFIG.discussed.color }}>
            {counts.discussed} omówione
          </span>
          <span style={{ opacity: 0.4 }}>&middot;</span>
          <span style={{ color: STATUS_CONFIG.rejected.color }}>
            {counts.rejected} odrzucone
          </span>

          <button
            className="btn"
            onClick={clearAll}
            style={{ marginLeft: 'auto', fontSize: 12, padding: '4px 10px' }}
          >
            Wyczyść
          </button>
        </div>
      )}

      {/* Cards grid */}
      {items.length === 0 && (
        <p style={{ color: 'var(--txt-muted)', textAlign: 'center', marginTop: 40 }}>
          Brak zaparkowanych tematów. Dodaj pierwszy!
        </p>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 12,
        }}
      >
        {items.map((item) => {
          const cfg = STATUS_CONFIG[item.status];
          return (
            <div
              key={item.id}
              style={{
                background: cfg.bg,
                border: `1px solid ${cfg.color}33`,
                borderRadius: 'var(--radius)',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                position: 'relative',
                transition: 'background 0.2s',
              }}
            >
              {/* Delete X */}
              <button
                onClick={() => removeItem(item.id)}
                title="Usuń"
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 8,
                  background: 'none',
                  border: 'none',
                  color: 'var(--txt-muted)',
                  cursor: 'pointer',
                  fontSize: 16,
                  lineHeight: 1,
                  padding: 2,
                  opacity: 0.6,
                }}
              >
                &times;
              </button>

              {/* Title */}
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--txt-main)',
                  paddingRight: 20,
                  wordBreak: 'break-word',
                }}
              >
                {item.title}
              </span>

              {/* Bottom row: status badge + time */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => cycleStatus(item.id)}
                  title="Kliknij aby zmienić status"
                  style={{
                    background: `${cfg.color}22`,
                    border: `1px solid ${cfg.color}55`,
                    borderRadius: 20,
                    color: cfg.color,
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '3px 10px',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  {cfg.label}
                </button>
                <span style={{ fontSize: 11, color: 'var(--txt-muted)', marginLeft: 'auto' }}>
                  {fmtTime(item.createdAt)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
