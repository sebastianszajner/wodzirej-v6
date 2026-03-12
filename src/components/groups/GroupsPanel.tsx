import { useStore } from '../../store';
import { canonicalFirst } from '../../logic/nicknames';
import { FullscreenButton } from '../ui/FullscreenButton';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { Participant } from '../../store/types';

type ViewMode = 'list' | 'tile';

// ── Group History ───────────────────────────────────────────────────────────
interface GroupSnapshot {
  id: string;
  timestamp: number;
  groups: { index: number; color: string; members: string[] }[];
  mode: string;
  participantCount: number;
}

const HISTORY_KEY = 'wodzirej-group-history';

function loadHistory(): GroupSnapshot[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveHistory(h: GroupSnapshot[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, 50)));
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatMember(member: Participant, allParticipants: Participant[]) {
  const fn = member.first || member.text || '?';
  const ln = member.last || '';
  const canon = canonicalFirst(fn);
  const count = allParticipants.filter(
    (p) => canonicalFirst(p.first || p.text || '') === canon
  ).length;
  if (count < 2 || !ln) return { fn, ln: '' };
  return { fn, ln: ln[0].toUpperCase() + '.' };
}

function pairMatrix(history: GroupSnapshot[]): Map<string, Map<string, number>> {
  const matrix = new Map<string, Map<string, number>>();
  for (const snap of history) {
    for (const g of snap.groups) {
      for (let i = 0; i < g.members.length; i++) {
        for (let j = i + 1; j < g.members.length; j++) {
          const a = g.members[i], b = g.members[j];
          if (!matrix.has(a)) matrix.set(a, new Map());
          if (!matrix.has(b)) matrix.set(b, new Map());
          matrix.get(a)!.set(b, (matrix.get(a)!.get(b) || 0) + 1);
          matrix.get(b)!.set(a, (matrix.get(b)!.get(a) || 0) + 1);
        }
      }
    }
  }
  return matrix;
}

// ── Component ───────────────────────────────────────────────────────────────

export function GroupsPanel() {
  const panelRef = useRef<HTMLDivElement>(null);
  const participants = useStore((s) => s.participants);
  const groups = useStore((s) => s.groups);
  const groupMode = useStore((s) => s.groupMode);
  const groupSize = useStore((s) => s.groupSize);
  const groupCount = useStore((s) => s.groupCount);
  const setGroupMode = useStore((s) => s.setGroupMode);
  const setGroupSize = useStore((s) => s.setGroupSize);
  const setGroupCount = useStore((s) => s.setGroupCount);
  const generate = useStore((s) => s.generateGroups);
  const showToast = useStore((s) => s.showToast);
  const spokeIds = useStore((s) => s.spokeIds);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [history, setHistory] = useState<GroupSnapshot[]>(loadHistory);
  const [showHistory, setShowHistory] = useState(false);
  const prevGroupsRef = useRef<string>('');

  // ── Drag & Drop ───────────────────────────────────────────────────────────
  const [dragParticipantId, setDragParticipantId] = useState<string | null>(null);
  const [dragSourceGroupId, setDragSourceGroupId] = useState<string | null>(null);
  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null);

  const handleDragStart = useCallback((participantId: string, groupId: string) => {
    setDragParticipantId(participantId);
    setDragSourceGroupId(groupId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, groupId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverGroupId(groupId);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverGroupId(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetGroupId: string) => {
    e.preventDefault();
    setDragOverGroupId(null);
    if (!dragParticipantId || !dragSourceGroupId || dragSourceGroupId === targetGroupId) {
      setDragParticipantId(null);
      setDragSourceGroupId(null);
      return;
    }
    // Move participant between groups in store
    const currentGroups = useStore.getState().groups;
    const newGroups = currentGroups.map(g => ({ ...g, members: [...g.members] }));
    const srcGroup = newGroups.find(g => g.id === dragSourceGroupId);
    const tgtGroup = newGroups.find(g => g.id === targetGroupId);
    if (!srcGroup || !tgtGroup) return;
    const memberIdx = srcGroup.members.findIndex(m => m.id === dragParticipantId);
    if (memberIdx === -1) return;
    const [member] = srcGroup.members.splice(memberIdx, 1);
    tgtGroup.members.push(member);
    useStore.setState({ groups: newGroups });
    showToast(`${member.first} → Grupa ${tgtGroup.index}`, 'info');
    setDragParticipantId(null);
    setDragSourceGroupId(null);
  }, [dragParticipantId, dragSourceGroupId, showToast]);

  const handleDragEnd = useCallback(() => {
    setDragParticipantId(null);
    setDragSourceGroupId(null);
    setDragOverGroupId(null);
  }, []);

  // ── Smart Constraints ─────────────────────────────────────────────────────
  const CONSTRAINTS_KEY = 'wodzirej-group-constraints';
  const [constraints, setConstraints] = useState<[string, string][]>(() => {
    try {
      const raw = localStorage.getItem(CONSTRAINTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });
  const [showConstraints, setShowConstraints] = useState(false);
  const [constraintA, setConstraintA] = useState('');
  const [constraintB, setConstraintB] = useState('');

  const saveConstraints = (c: [string, string][]) => {
    setConstraints(c);
    localStorage.setItem(CONSTRAINTS_KEY, JSON.stringify(c));
  };

  const addConstraint = () => {
    if (!constraintA || !constraintB || constraintA === constraintB) return;
    // Avoid duplicates
    const exists = constraints.some(
      ([a, b]) => (a === constraintA && b === constraintB) || (a === constraintB && b === constraintA)
    );
    if (exists) { showToast('Ta para już istnieje', 'error'); return; }
    saveConstraints([...constraints, [constraintA, constraintB]]);
    setConstraintA('');
    setConstraintB('');
  };

  const removeConstraint = (idx: number) => {
    saveConstraints(constraints.filter((_, i) => i !== idx));
  };

  const handleGenerate = () => {
    generate(constraints.length > 0 ? constraints : undefined);
  };

  // Font zoom (persisted)
  const ZOOM_KEY = 'wodzirej-group-zoom';
  const [fontZoom, setFontZoom] = useState<number>(() => {
    try { return Number(localStorage.getItem(ZOOM_KEY)) || 0; } catch { return 0; }
  });
  const zoomIn = () => setFontZoom(z => { const n = Math.min(z + 1, 8); localStorage.setItem(ZOOM_KEY, String(n)); return n; });
  const zoomOut = () => setFontZoom(z => { const n = Math.max(z - 1, -3); localStorage.setItem(ZOOM_KEY, String(n)); return n; });
  const zoomReset = () => { setFontZoom(0); localStorage.removeItem(ZOOM_KEY); };

  const total = participants.length;
  const density = total <= 12 ? 'd-s' : total <= 20 ? 'd-m' : 'd-l';

  const cols = groups.length <= 2 ? 2
             : groups.length <= 6 ? 3
             : groups.length <= 9 ? 3
             : 4;

  // Auto-save group snapshots to history when groups change
  useEffect(() => {
    if (groups.length === 0) return;
    const key = groups.map(g => g.id).join(',');
    if (key === prevGroupsRef.current) return;
    prevGroupsRef.current = key;

    const snap: GroupSnapshot = {
      id: Date.now().toString(36),
      timestamp: Date.now(),
      groups: groups.map(g => ({
        index: g.index,
        color: g.color,
        members: g.members.map(m => m.text),
      })),
      mode: groupMode === 'bySize' ? `po ${groupSize} os.` : `${groupCount} grup`,
      participantCount: participants.length,
    };
    const updated = [snap, ...history].slice(0, 50);
    setHistory(updated);
    saveHistory(updated);
  }, [groups]);

  const copyGroups = async () => {
    if (!groups.length) { showToast('Najpierw utwórz grupy', 'error'); return; }
    const text = groups.map((g) =>
      `Grupa ${g.index}: ${g.members.map((m) => m.text).join(', ')}`
    ).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      showToast('Skopiowano grupy', 'success');
    } catch {
      showToast('Brak dostępu do schowka', 'error');
    }
  };

  const exportCSV = () => {
    if (!groups.length) { showToast('Najpierw utwórz grupy', 'error'); return; }
    const maxLen = Math.max(...groups.map((g) => g.members.length));
    const header = ['Grupa', ...Array.from({ length: maxLen }, (_, i) => `Osoba ${i + 1}`)];
    const rows = [header, ...groups.map((g) => [
      `Grupa ${g.index}`, ...g.members.map((m) => m.text),
    ])];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `grupy_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const exportFullReport = () => {
    if (history.length === 0) { showToast('Brak historii do eksportu', 'error'); return; }
    const matrix = pairMatrix(history);
    const allNames = [...new Set(history.flatMap(s => s.groups.flatMap(g => g.members)))].sort();

    let report = `RAPORT GRUP — ${new Date().toLocaleDateString('pl')}\n`;
    report += `${'='.repeat(60)}\n\n`;
    report += `Liczba losowań: ${history.length}\n`;
    report += `Unikalni uczestnicy: ${allNames.length}\n\n`;

    // History
    report += `HISTORIA LOSOWAŃ\n${'─'.repeat(40)}\n`;
    for (const snap of [...history].reverse()) {
      const dt = new Date(snap.timestamp);
      report += `\n${dt.toLocaleTimeString('pl', { hour: '2-digit', minute: '2-digit' })} — ${snap.mode} (${snap.participantCount} os.)\n`;
      for (const g of snap.groups) {
        report += `  Grupa ${g.index}: ${g.members.join(', ')}\n`;
      }
    }

    // Pair analysis
    report += `\n\nANALIZA PAR — kto z kim najczęściej\n${'─'.repeat(40)}\n`;
    const pairs: { a: string; b: string; count: number }[] = [];
    for (const [a, inner] of matrix) {
      for (const [b, count] of inner) {
        if (a < b) pairs.push({ a, b, count });
      }
    }
    pairs.sort((x, y) => y.count - x.count);
    const topPairs = pairs.slice(0, 20);
    if (topPairs.length > 0) {
      for (const p of topPairs) {
        report += `  ${p.a} ↔ ${p.b}: ${p.count}×\n`;
      }
    }

    // Never together
    if (history.length >= 2) {
      const neverPairs = pairs.length > 0
        ? allNames.flatMap((a, i) =>
            allNames.slice(i + 1)
              .filter(b => !matrix.get(a)?.has(b))
              .map(b => `${a} ↔ ${b}`)
          ).slice(0, 15)
        : [];
      if (neverPairs.length > 0) {
        report += `\nNIGDY RAZEM W GRUPIE\n${'─'.repeat(40)}\n`;
        for (const p of neverPairs) {
          report += `  ${p}\n`;
        }
      }
    }

    report += `\n${'='.repeat(60)}\nWygenerowano przez Wodzirej — narzędzia trenerskie\n`;

    const blob = new Blob(['\ufeff' + report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `raport-grup_${new Date().toISOString().slice(0,10)}.txt`;
    a.click(); URL.revokeObjectURL(url);
    showToast('Raport wyeksportowany', 'success');
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
    showToast('Historia wyczyszczona', 'info');
  };

  return (
    <div className="panel" ref={panelRef} style={{ overflow: 'hidden' }}>
      <style>{GH_STYLES}</style>
      {/* Controls bar */}
      <div className="groups-controls">
        <div className="mode-seg">
          <button
            className={groupMode === 'bySize' ? 'active' : ''}
            onClick={() => setGroupMode('bySize')}
          >po N osób</button>
          <button
            className={groupMode === 'byCount' ? 'active' : ''}
            onClick={() => setGroupMode('byCount')}
          >na X grup</button>
        </div>

        {groupMode === 'bySize' ? (
          <>
            <label>Osób w grupie</label>
            <select
              value={groupSize}
              onChange={(e) => setGroupSize(Number(e.target.value))}
            >
              {[2,3,4,5,6,7,8].map((n) => (
                <option key={n} value={n}>{n} osoby</option>
              ))}
            </select>
          </>
        ) : (
          <>
            <label>Liczba grup</label>
            <input
              type="number" min={2} max={15} value={groupCount}
              onChange={(e) => setGroupCount(Number(e.target.value))}
            />
          </>
        )}

        <button className="btn primary" onClick={handleGenerate}>
          🎲 Generuj
        </button>
        <button
          className={`btn sm ${showConstraints ? 'active' : ''}`}
          onClick={() => setShowConstraints(v => !v)}
          title="Zasady grupowania"
          style={{ position: 'relative' }}
        >
          ⚙️ Zasady{constraints.length > 0 ? ` (${constraints.length})` : ''}
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="mode-seg zoom-seg">
            <button onClick={zoomOut} title="Zmniejsz tekst">A−</button>
            <button onClick={zoomReset} title="Resetuj" className={fontZoom === 0 ? 'active' : ''} style={{ fontSize: 11, minWidth: 28 }}>{fontZoom === 0 ? '•' : fontZoom > 0 ? `+${fontZoom}` : fontZoom}</button>
            <button onClick={zoomIn} title="Powiększ tekst">A+</button>
          </div>
          <FullscreenButton targetRef={panelRef} />
          <div className="mode-seg">
            <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}>≡</button>
            <button className={viewMode === 'tile' ? 'active' : ''} onClick={() => setViewMode('tile')}>⊞</button>
          </div>
          <button className="btn sm" onClick={copyGroups}>Kopiuj</button>
          <button className="btn sm" onClick={exportCSV}>CSV</button>
          <button
            className={`btn sm ${showHistory ? 'active' : ''}`}
            onClick={() => setShowHistory(v => !v)}
            title="Historia losowań"
          >
            📊 Historia{history.length > 0 ? ` (${history.length})` : ''}
          </button>
        </div>
      </div>

      {/* History panel */}
      {showHistory && (
        <div className="gh-panel">
          <div className="gh-header">
            <span className="gh-title">Historia losowań ({history.length})</span>
            <div className="gh-actions">
              <button className="btn sm" onClick={exportFullReport} disabled={history.length === 0}>
                📄 Raport
              </button>
              <button className="btn sm" onClick={clearHistory} disabled={history.length === 0}>
                🗑️ Wyczyść
              </button>
            </div>
          </div>

          {history.length === 0 ? (
            <div className="gh-empty">Brak historii — losuj grupy, a zostaną zapisane automatycznie.</div>
          ) : (
            <div className="gh-list">
              {history.map((snap) => {
                const dt = new Date(snap.timestamp);
                return (
                  <div key={snap.id} className="gh-item">
                    <div className="gh-item-header">
                      <span className="gh-time">
                        {dt.toLocaleTimeString('pl', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="gh-meta">{snap.mode}</span>
                      <span className="gh-meta">{snap.participantCount} os.</span>
                      <span className="gh-meta">{snap.groups.length} grup</span>
                    </div>
                    <div className="gh-item-groups">
                      {snap.groups.map((g, i) => (
                        <div key={i} className="gh-mini-group">
                          <span className="gh-mini-dot" style={{ background: g.color }} />
                          <span className="gh-mini-members">{g.members.join(', ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pair analytics */}
          {history.length >= 2 && (() => {
            const matrix = pairMatrix(history);
            const allPairs: { a: string; b: string; count: number }[] = [];
            for (const [a, inner] of matrix) {
              for (const [b, count] of inner) {
                if (a < b) allPairs.push({ a, b, count });
              }
            }
            allPairs.sort((x, y) => y.count - x.count);
            const top = allPairs.filter(p => p.count >= 2).slice(0, 10);
            if (top.length === 0) return null;
            return (
              <div className="gh-analytics">
                <div className="gh-analytics-title">Najczęstsze pary</div>
                {top.map((p, i) => (
                  <div key={i} className="gh-pair">
                    <span className="gh-pair-names">{p.a} ↔ {p.b}</span>
                    <span className="gh-pair-bar">
                      <span style={{ width: `${(p.count / top[0].count) * 100}%` }} />
                    </span>
                    <span className="gh-pair-count">{p.count}×</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* Constraints editor */}
      {showConstraints && (
        <div className="gh-panel" style={{ maxHeight: 200 }}>
          <div className="gh-header">
            <span className="gh-title">Zasady: nigdy razem w grupie</span>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
            <select
              value={constraintA}
              onChange={e => setConstraintA(e.target.value)}
              style={{ fontSize: 12, padding: '3px 6px', background: 'var(--input-bg)', color: 'var(--txt-main)', border: '1px solid var(--line)', borderRadius: 4 }}
            >
              <option value="">Osoba A</option>
              {participants.map(p => (
                <option key={p.id} value={p.id}>{p.text || p.first}</option>
              ))}
            </select>
            <span style={{ color: 'var(--txt-muted)', fontSize: 12 }}>≠</span>
            <select
              value={constraintB}
              onChange={e => setConstraintB(e.target.value)}
              style={{ fontSize: 12, padding: '3px 6px', background: 'var(--input-bg)', color: 'var(--txt-main)', border: '1px solid var(--line)', borderRadius: 4 }}
            >
              <option value="">Osoba B</option>
              {participants.map(p => (
                <option key={p.id} value={p.id}>{p.text || p.first}</option>
              ))}
            </select>
            <button className="btn sm primary" onClick={addConstraint} disabled={!constraintA || !constraintB || constraintA === constraintB}>
              Dodaj
            </button>
          </div>
          {constraints.length === 0 ? (
            <div className="gh-empty">Brak zasad. Dodaj pary, które nie powinny trafić do jednej grupy.</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {constraints.map(([a, b], idx) => {
                const nameA = participants.find(p => p.id === a)?.first ?? a;
                const nameB = participants.find(p => p.id === b)?.first ?? b;
                return (
                  <span
                    key={idx}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      background: 'rgba(233,30,99,0.15)', color: 'var(--accent)',
                      padding: '2px 8px', borderRadius: 12, fontSize: 12,
                    }}
                  >
                    {nameA} ≠ {nameB}
                    <button
                      onClick={() => removeConstraint(idx)}
                      style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1 }}
                    >×</button>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Groups grid */}
      <div
        className={`groups-grid ${density} ${viewMode === 'tile' ? 'tile' : ''}`}
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`,
          flex: 1,
          overflowY: 'auto',
          padding: 16,
          '--grp-zoom': fontZoom,
        } as React.CSSProperties}
      >
        {groups.length === 0 && (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <div className="es-icon">👥</div>
            <p>Kliknij „Generuj" aby podzielić uczestników na grupy</p>
          </div>
        )}

        {groups.map((g, gi) => (
          <div
            className={`group-card ${dragOverGroupId === g.id ? 'gc-drag-over' : ''}`}
            key={g.id}
            style={{ '--gc': g.color, '--card-index': gi } as React.CSSProperties}
            onDragOver={(e) => handleDragOver(e, g.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, g.id)}
          >
            <div className="group-card-header" style={{ borderTopColor: g.color }}>
              <span className="gc-color-dot" style={{ background: g.color }} />
              <b>Grupa {g.index}</b>
              <span className="gc-count">{g.members.length} os.</span>
            </div>
            <div className="group-card-body">
              <ul>
                {g.members.map((m) => {
                  const { fn, ln } = formatMember(m, participants);
                  const spoke = spokeIds.includes(m.id);
                  return (
                    <li
                      key={m.id}
                      className={`${spoke ? 'gc-member-spoke' : ''} ${dragParticipantId === m.id ? 'gc-dragging' : ''}`}
                      draggable
                      onDragStart={() => handleDragStart(m.id, g.id)}
                      onDragEnd={handleDragEnd}
                      style={{ cursor: 'grab' }}
                    >
                      {spoke && (
                        <span
                          className="gc-spoke-dot"
                          style={{ background: g.color }}
                          title="Już mówiła/mówił"
                        />
                      )}
                      <span className="gc-fn">{fn}</span>
                      {ln && <span className="gc-ln">{ln}</span>}
                      {spoke && <span style={{opacity:0.5, fontSize:'0.8em'}}>🎤</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const GH_STYLES = `
.gh-panel {
  background: var(--bg2);
  border-bottom: 1px solid var(--line);
  max-height: 300px;
  overflow-y: auto;
  padding: 10px 16px;
}
.gh-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.gh-title { font-weight: 700; font-size: 13px; }
.gh-actions { display: flex; gap: 6px; }
.gh-empty { color: var(--txt-muted); font-size: 13px; padding: 8px 0; }

.gh-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.gh-item {
  background: var(--input-bg);
  border-radius: var(--radius);
  padding: 8px 10px;
  border: 1px solid var(--line);
}
.gh-item-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}
.gh-time {
  font-weight: 700;
  font-size: 12px;
  color: var(--accent);
}
.gh-meta {
  font-size: 11px;
  color: var(--txt-muted);
  background: rgba(255,255,255,0.05);
  padding: 1px 6px;
  border-radius: 4px;
}
.gh-item-groups {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.gh-mini-group {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--txt-muted);
}
.gh-mini-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.gh-mini-members {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Analytics */
.gh-analytics {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--line);
}
.gh-analytics-title {
  font-weight: 700;
  font-size: 12px;
  color: var(--txt-muted);
  margin-bottom: 6px;
}
.gh-pair {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  padding: 2px 0;
}
.gh-pair-names {
  min-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--txt-main);
}
.gh-pair-bar {
  flex: 1;
  height: 6px;
  background: rgba(255,255,255,0.06);
  border-radius: 3px;
  overflow: hidden;
}
.gh-pair-bar span {
  display: block;
  height: 100%;
  background: var(--accent);
  border-radius: 3px;
  transition: width .3s;
}
.gh-pair-count {
  font-weight: 700;
  color: var(--accent);
  min-width: 24px;
  text-align: right;
}

/* Drag & drop */
.gc-drag-over {
  outline: 2px dashed var(--accent) !important;
  outline-offset: -2px;
  background: rgba(233,30,99,0.06) !important;
}
.gc-dragging {
  opacity: 0.4;
}
li[draggable="true"]:hover {
  background: rgba(255,255,255,0.04);
  border-radius: 4px;
}

@media (max-width: 600px) {
  .gh-pair-names { min-width: 80px; }
  .gh-panel { max-height: 250px; }
}
`;
