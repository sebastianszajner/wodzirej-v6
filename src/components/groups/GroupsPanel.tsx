import { useStore } from '../../store';
import { needsLastName } from '../../logic/nicknames';
import { useState } from 'react';
import type { Participant } from '../../store/types';

type ViewMode = 'list' | 'tile';

function formatMember(member: Participant, allInGroup: Participant[]) {
  const fn = member.first || member.text || '?';
  const ln = member.last || '';
  const firstNames = allInGroup.map((m) => m.first || m.text || '');
  const needs = needsLastName(fn, firstNames);
  if (!needs || !ln) return { fn, ln: '' };
  return { fn, ln: ln[0].toUpperCase() + '.' };
}

export function GroupsPanel() {
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
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const total = participants.length;
  const density = total <= 12 ? 'd-s' : total <= 20 ? 'd-m' : 'd-l';

  const cols = groups.length <= 2 ? 2
             : groups.length <= 6 ? 3
             : groups.length <= 9 ? 3
             : 4;

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

  return (
    <div className="panel" style={{ overflow: 'hidden' }}>
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

        <button className="btn primary" onClick={generate}>
          🎲 Generuj
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <div className="mode-seg">
            <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}>≡</button>
            <button className={viewMode === 'tile' ? 'active' : ''} onClick={() => setViewMode('tile')}>⊞</button>
          </div>
          <button className="btn sm" onClick={copyGroups}>Kopiuj</button>
          <button className="btn sm" onClick={exportCSV}>CSV</button>
        </div>
      </div>

      {/* Groups grid */}
      <div
        className={`groups-grid ${density} ${viewMode === 'tile' ? 'tile' : ''}`}
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`,
          flex: 1,
          overflowY: 'auto',
          padding: 16,
          alignContent: 'start',
        }}
      >
        {groups.length === 0 && (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <div className="es-icon">👥</div>
            <p>Kliknij „Generuj" aby podzielić uczestników na grupy</p>
          </div>
        )}

        {groups.map((g) => (
          <div className="group-card" key={g.id}>
            <div className="group-card-header">
              <b>Grupa {g.index}</b>
              <span className="gc-count">{g.members.length} os.</span>
            </div>
            <div className="group-card-body">
              <ul>
                {g.members.map((m) => {
                  const { fn, ln } = formatMember(m, g.members);
                  return (
                    <li key={m.id}>
                      <span className="gc-fn">{fn}</span>
                      {ln && <span className="gc-ln">{ln}</span>}
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
