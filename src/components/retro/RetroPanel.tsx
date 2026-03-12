import { useState, useCallback, useMemo } from 'react';
import type { RetroFormat, RetroCard } from '../../store/types';

// ── Format definitions ───────────────────────────────────────────────────────
interface ColumnDef {
  key: string;
  label: string;
  color: string;
}

const FORMATS: Record<RetroFormat, { label: string; columns: ColumnDef[] }> = {
  ssc: {
    label: 'Start / Stop / Continue',
    columns: [
      { key: 'start',    label: 'Start',    color: '#4caf50' },
      { key: 'stop',     label: 'Stop',     color: '#e91e63' },
      { key: 'continue', label: 'Continue', color: '#2196f3' },
    ],
  },
  gsm: {
    label: 'Glad / Sad / Mad',
    columns: [
      { key: 'glad', label: 'Glad', color: '#4caf50' },
      { key: 'sad',  label: 'Sad',  color: '#2196f3' },
      { key: 'mad',  label: 'Mad',  color: '#e91e63' },
    ],
  },
  '4l': {
    label: '4L: Liked / Learned / Lacked / Longed For',
    columns: [
      { key: 'liked',     label: 'Liked',      color: '#4caf50' },
      { key: 'learned',   label: 'Learned',    color: '#2196f3' },
      { key: 'lacked',    label: 'Lacked',     color: '#ff9800' },
      { key: 'longedfor', label: 'Longed For', color: '#9c27b0' },
    ],
  },
};

let _rcId = 0;
const rcId = () => `rc-${++_rcId}`;

// ── Component ────────────────────────────────────────────────────────────────
export function RetroPanel() {
  const [format, setFormat] = useState<RetroFormat>('ssc');
  const [cards, setCards] = useState<RetroCard[]>([]);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [votingMode, setVotingMode] = useState(false);

  const fmt = FORMATS[format];

  const addCard = useCallback((column: string) => {
    const text = (inputs[column] || '').trim();
    if (!text) return;
    setCards((prev) => [...prev, { id: rcId(), column, text, votes: 0 }]);
    setInputs((prev) => ({ ...prev, [column]: '' }));
  }, [inputs]);

  const removeCard = useCallback((id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const vote = useCallback((id: string) => {
    setCards((prev) => prev.map((c) => c.id === id ? { ...c, votes: c.votes + 1 } : c));
  }, []);

  const resetAll = useCallback(() => {
    if (cards.length > 0 && confirm('Wyczyścić wszystkie karty?')) {
      setCards([]);
      setInputs({});
      setVotingMode(false);
    }
  }, [cards.length]);

  const changeFormat = useCallback((f: RetroFormat) => {
    if (cards.length > 0 && !confirm('Zmiana formatu usunie karty. Kontynuować?')) return;
    setFormat(f);
    setCards([]);
    setInputs({});
    setVotingMode(false);
  }, [cards.length]);

  const columnCards = useMemo(() => {
    const map: Record<string, RetroCard[]> = {};
    for (const col of fmt.columns) {
      const colCards = cards.filter((c) => c.column === col.key);
      if (votingMode) colCards.sort((a, b) => b.votes - a.votes);
      map[col.key] = colCards;
    }
    return map;
  }, [cards, fmt.columns, votingMode]);

  const exportToClipboard = useCallback(() => {
    const lines: string[] = [];
    if (votingMode) lines.push('[Tryb głosowania — posortowane wg głosów]\n');
    for (const col of fmt.columns) {
      lines.push(`## ${col.label}`);
      const colCards = columnCards[col.key];
      if (colCards.length === 0) {
        lines.push('  (brak kart)\n');
      } else {
        for (const card of colCards) {
          const voteSuffix = votingMode ? ` [${card.votes} głosów]` : '';
          lines.push(`  - ${card.text}${voteSuffix}`);
        }
        lines.push('');
      }
    }
    navigator.clipboard.writeText(lines.join('\n')).catch(() => {});
  }, [fmt.columns, columnCards, votingMode]);

  const totalCards = cards.length;

  return (
    <div className="panel retro-panel" style={{ overflow: 'auto', padding: '16px', flex: 1 }}>
      <style>{retroCSS}</style>

      {/* Toolbar */}
      <div className="retro-toolbar">
        <div className="retro-format-btns">
          {(Object.keys(FORMATS) as RetroFormat[]).map((f) => (
            <button
              key={f}
              className={`btn sm ${f === format ? 'primary' : ''}`}
              onClick={() => changeFormat(f)}
            >
              {FORMATS[f].label}
            </button>
          ))}
        </div>
        <div className="retro-toolbar-actions">
          <button
            className={`btn sm ${votingMode ? 'primary' : ''}`}
            onClick={() => setVotingMode((v) => !v)}
          >
            {votingMode ? '✓ Głosowanie' : 'Głosowanie'}
          </button>
          <button className="btn sm" onClick={exportToClipboard} disabled={totalCards === 0}>
            Kopiuj do schowka
          </button>
          <button className="btn sm danger" onClick={resetAll} disabled={totalCards === 0}>
            Reset
          </button>
        </div>
      </div>

      {/* Columns */}
      <div className="retro-columns" style={{ gridTemplateColumns: `repeat(${fmt.columns.length}, 1fr)` }}>
        {fmt.columns.map((col) => (
          <div key={col.key} className="retro-column">
            <div className="retro-col-header" style={{ background: col.color }}>
              {col.label}
              <span className="retro-col-count">{columnCards[col.key].length}</span>
            </div>

            <div className="retro-col-cards">
              {columnCards[col.key].map((card) => (
                <div key={card.id} className="retro-card">
                  <div className="retro-card-text">{card.text}</div>
                  <div className="retro-card-actions">
                    {votingMode && (
                      <button className="retro-vote-btn" onClick={() => vote(card.id)} title="Głosuj +1">
                        <span className="retro-vote-dot" style={{ background: col.color }} />
                        <span className="retro-vote-num">{card.votes}</span>
                      </button>
                    )}
                    <button className="retro-del-btn" onClick={() => removeCard(card.id)} title="Usuń">
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add card input */}
            <div className="retro-add-row">
              <input
                className="retro-add-input"
                placeholder="Dodaj kartę..."
                value={inputs[col.key] || ''}
                onChange={(e) => setInputs((prev) => ({ ...prev, [col.key]: e.target.value }))}
                onKeyDown={(e) => { if (e.key === 'Enter') addCard(col.key); }}
              />
              <button
                className="retro-add-btn"
                style={{ background: col.color }}
                onClick={() => addCard(col.key)}
                disabled={!(inputs[col.key] || '').trim()}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── CSS ──────────────────────────────────────────────────────────────────────
const retroCSS = `
.retro-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.retro-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  justify-content: space-between;
}
.retro-format-btns {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.retro-toolbar-actions {
  display: flex;
  gap: 6px;
}

.retro-columns {
  display: grid;
  gap: 10px;
  flex: 1;
  min-height: 0;
  align-items: start;
}

.retro-column {
  display: flex;
  flex-direction: column;
  background: var(--input-bg);
  border-radius: var(--radius);
  border: 1px solid var(--line);
  overflow: hidden;
}

.retro-col-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  font-weight: 700;
  font-size: 13px;
  color: #fff;
  letter-spacing: .3px;
}
.retro-col-count {
  font-size: 11px;
  background: rgba(0,0,0,.25);
  padding: 1px 7px;
  border-radius: 99px;
  font-weight: 600;
}

.retro-col-cards {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  min-height: 40px;
  max-height: 360px;
  overflow-y: auto;
}

.retro-card {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  background: var(--panel-bg);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 8px 10px;
  animation: retro-slide .2s ease-out;
}
@keyframes retro-slide {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.retro-card-text {
  flex: 1;
  font-size: 13px;
  line-height: 1.4;
  color: var(--txt-main);
  word-break: break-word;
}
.retro-card-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}
.retro-vote-btn {
  display: flex;
  align-items: center;
  gap: 3px;
  background: rgba(255,255,255,.06);
  border: none;
  border-radius: 6px;
  padding: 3px 7px;
  cursor: pointer;
  color: var(--txt-main);
  font-size: 12px;
  font-weight: 600;
}
.retro-vote-btn:hover { background: rgba(255,255,255,.12); }
.retro-vote-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.retro-vote-num { min-width: 12px; text-align: center; }
.retro-del-btn {
  background: none;
  border: none;
  color: var(--txt-muted);
  font-size: 11px;
  padding: 3px 5px;
  border-radius: 4px;
  cursor: pointer;
}
.retro-del-btn:hover { color: var(--accent); background: rgba(233,30,99,.15); }

.retro-add-row {
  display: flex;
  gap: 6px;
  padding: 8px;
  border-top: 1px solid var(--line);
}
.retro-add-input {
  flex: 1;
  padding: 6px 10px;
  background: var(--panel-bg);
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--txt-main);
  font-size: 12px;
}
.retro-add-input::placeholder { color: var(--txt-muted); }
.retro-add-btn {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}
.retro-add-btn:hover { filter: brightness(1.15); }
.retro-add-btn:disabled { opacity: .4; cursor: not-allowed; }

@media (max-width: 600px) {
  .retro-columns { grid-template-columns: 1fr 1fr !important; }
  .retro-col-cards { max-height: 200px; }
}
@media (max-width: 400px) {
  .retro-columns { grid-template-columns: 1fr !important; }
}
`;
