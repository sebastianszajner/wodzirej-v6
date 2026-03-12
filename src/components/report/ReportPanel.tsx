import { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { isFirebaseConfigured } from '../../lib/firebase';
import { getActiveTraining } from '../../lib/activityLog';
import {
  fetchActivities,
  getSavedTraining,
  type ActivityEntry,
} from '../../lib/training';

// ── Helpers ──────────────────────────────────────────────────────────────────

const ACTION_ICONS: Record<string, string> = {
  checked_in: '\u2705',
  spun: '\uD83C\uDFA1',
  scored: '\u26A1',
  spoke: '\uD83C\uDFA4',
  rated: '\uD83D\uDD0B',
  voted: '\uD83D\uDCCA',
  assigned_question: '\uD83E\uDDE9',
  assigned_group: '\uD83D\uDC65',
  quiz_completed: '\uD83E\uDDE0',
};

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
}

function formatAction(entry: ActivityEntry): string {
  const icon = ACTION_ICONS[entry.action] || '\u25CF';
  const panel = entry.panel.charAt(0).toUpperCase() + entry.panel.slice(1);
  const extras: string[] = [];

  if (entry.data) {
    if (typeof entry.data.points === 'number') extras.push(`${entry.data.points > 0 ? '+' : ''}${entry.data.points} pkt`);
    if (typeof entry.data.duration === 'number') {
      const m = Math.floor(entry.data.duration / 60);
      const s = entry.data.duration % 60;
      extras.push(`${m}:${String(s).padStart(2, '0')}`);
    }
    if (typeof entry.data.level === 'number') extras.push(`${entry.data.level}/5`);
  }

  return `${icon}  ${panel}: ${entry.action}${extras.length ? ' (' + extras.join(', ') + ')' : ''}`;
}

// ── Export ────────────────────────────────────────────────────────────────────

function exportCSV(activities: ActivityEntry[], participants: { id: string; text: string }[]) {
  const nameMap = new Map(participants.map((p) => [p.id, p.text]));
  const rows = [['Timestamp', 'Time', 'Participant', 'Panel', 'Action', 'Data'].join(';')];

  for (const a of activities) {
    rows.push([
      a.timestamp,
      formatTime(a.timestamp),
      nameMap.get(a.participantId) || a.participantId,
      a.panel,
      a.action,
      a.data ? JSON.stringify(a.data) : '',
    ].join(';'));
  }

  const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `wodzirej-raport-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportTXT(
  activities: ActivityEntry[],
  participants: { id: string; text: string }[],
  title: string,
) {
  const byParticipant = new Map<string, ActivityEntry[]>();

  for (const a of activities) {
    const list = byParticipant.get(a.participantId) || [];
    list.push(a);
    byParticipant.set(a.participantId, list);
  }

  const lines: string[] = [
    `RAPORT SZKOLENIOWY`,
    title ? `Szkolenie: ${title}` : '',
    `Data: ${new Date().toLocaleDateString('pl-PL')}`,
    `Uczestnicy: ${participants.length}`,
    `Aktywnosci: ${activities.length}`,
    '',
    '='.repeat(60),
    '',
  ];

  for (const p of participants) {
    const pActs = byParticipant.get(p.id) || [];
    lines.push(`--- ${p.text} ---`);
    if (pActs.length === 0) {
      lines.push('  (brak aktywnosci)');
    } else {
      for (const a of pActs) {
        lines.push(`  ${formatTime(a.timestamp)}  ${formatAction(a)}`);
      }
    }
    lines.push('');
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `wodzirej-raport-${new Date().toISOString().slice(0, 10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Component ────────────────────────────────────────────────────────────────

export function ReportPanel() {
  const participants = useStore((s) => s.participants);
  const showToast = useStore((s) => s.showToast);

  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const savedTraining = getSavedTraining();
  const activeCode = getActiveTraining() || savedTraining?.trainingCode || null;
  const title = savedTraining?.title || '';

  // Fetch activities from Firebase
  const loadActivities = async () => {
    if (!activeCode || !isFirebaseConfigured()) return;
    setLoading(true);
    try {
      const acts = await fetchActivities(activeCode);
      setActivities(acts);
    } catch {
      showToast('Blad ladowania aktywnosci', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCode]);

  // Filtered activities
  const filtered = selectedId
    ? activities.filter((a) => a.participantId === selectedId)
    : activities;

  // Stats per participant
  const statsMap = new Map<string, { count: number; points: number; speakTime: number }>();
  for (const a of activities) {
    const s = statsMap.get(a.participantId) || { count: 0, points: 0, speakTime: 0 };
    s.count++;
    if (a.data && typeof a.data.points === 'number') s.points += a.data.points;
    if (a.data && typeof a.data.duration === 'number') s.speakTime += a.data.duration;
    statsMap.set(a.participantId, s);
  }

  if (!activeCode) {
    return (
      <div className="panel">
        <div className="panel-body" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>{'\uD83D\uDCC8'}</p>
          <h3 style={{ marginBottom: 8 }}>Brak aktywnej sesji szkoleniowej</h3>
          <p style={{ color: 'var(--txt-muted)', fontSize: 13 }}>
            Rozpocznij szkolenie w zakladce Uczestnicy, aby zbierac dane o aktywnosciach.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Session header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: 'var(--txt-muted)' }}>
            Sesja: <strong>{activeCode}</strong>
            {title && ` \u2014 ${title}`}
          </span>
          <span style={{ fontSize: 12, color: 'var(--txt-muted)' }}>
            {activities.length} aktywnosci
          </span>
          <button className="btn sm" onClick={loadActivities} disabled={loading} style={{ marginLeft: 'auto' }}>
            {loading ? '\u23F3' : '\uD83D\uDD04'} Odswiez
          </button>
        </div>

        {/* Participant chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          <button
            className={`btn sm ${!selectedId ? 'primary' : ''}`}
            onClick={() => setSelectedId(null)}
            style={{ fontSize: 11 }}
          >
            Wszyscy ({activities.length})
          </button>
          {participants.map((p) => {
            const s = statsMap.get(p.id);
            return (
              <button
                key={p.id}
                className={`btn sm ${selectedId === p.id ? 'primary' : ''}`}
                onClick={() => setSelectedId(selectedId === p.id ? null : p.id)}
                style={{ fontSize: 11 }}
              >
                {p.first} {s ? `(${s.count})` : ''}
              </button>
            );
          })}
        </div>

        {/* Stats bar for selected participant */}
        {selectedId && statsMap.has(selectedId) && (() => {
          const s = statsMap.get(selectedId)!;
          const pName = participants.find((p) => p.id === selectedId)?.text || selectedId;
          return (
            <div style={{
              display: 'flex', gap: 12, padding: '8px 12px',
              background: 'var(--bg-card)', borderRadius: 8, fontSize: 12,
            }}>
              <strong>{pName}</strong>
              <span>{'\u26A1'} {s.points} pkt</span>
              <span>{'\uD83C\uDFA4'} {Math.floor(s.speakTime / 60)}:{String(s.speakTime % 60).padStart(2, '0')}</span>
              <span>{'\uD83D\uDCCB'} {s.count} aktywnosci</span>
            </div>
          );
        })()}

        {/* Timeline */}
        <div style={{
          flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2,
          minHeight: 0,
        }}>
          {filtered.length === 0 ? (
            <p style={{ color: 'var(--txt-muted)', fontSize: 12, textAlign: 'center', paddingTop: 32 }}>
              {activities.length === 0
                ? 'Brak zarejestrowanych aktywnosci'
                : 'Brak aktywnosci dla wybranego uczestnika'}
            </p>
          ) : (
            filtered.map((a, i) => {
              const pName = participants.find((p) => p.id === a.participantId)?.first || a.participantId.slice(0, 6);
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex', gap: 8, alignItems: 'baseline',
                    padding: '4px 8px', fontSize: 12,
                    borderLeft: '2px solid var(--accent)',
                    background: i % 2 === 0 ? 'transparent' : 'var(--bg-card)',
                  }}
                >
                  <span style={{ color: 'var(--txt-muted)', fontFamily: 'monospace', flexShrink: 0 }}>
                    {formatTime(a.timestamp)}
                  </span>
                  {!selectedId && (
                    <span style={{ fontWeight: 600, flexShrink: 0, minWidth: 50 }}>{pName}</span>
                  )}
                  <span>{formatAction(a)}</span>
                </div>
              );
            })
          )}
        </div>

        {/* Export buttons */}
        {activities.length > 0 && (
          <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
            <button className="btn sm" onClick={() => exportCSV(activities, participants)}>
              {'\uD83D\uDCBE'} CSV
            </button>
            <button className="btn sm" onClick={() => exportTXT(activities, participants, title)}>
              {'\uD83D\uDCC4'} TXT
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
