import { useState, useEffect } from 'react';
import {
  joinTraining,
  checkInParticipant,
  type TrainingParticipant,
} from '../../lib/training';
import { logActivity } from '../../lib/activityLog';

interface Props {
  trainingCode: string;
}

type Phase = 'loading' | 'list' | 'confirm' | 'done' | 'closed' | 'error';

export function CheckInView({ trainingCode }: Props) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [participants, setParticipants] = useState<Record<string, TrainingParticipant>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checkedInName, setCheckedInName] = useState('');

  // Load training on mount
  useEffect(() => {
    (async () => {
      try {
        const result = await joinTraining(trainingCode);
        if (!result.ok) {
          setPhase('error');
          setError(result.reason);
          return;
        }
        setTitle(result.title);
        setParticipants(result.participants);
        setPhase('list');
      } catch {
        setPhase('error');
        setError('Nie udało się połączyć z sesją szkoleniową');
      }
    })();
  }, [trainingCode]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setPhase('confirm');
  };

  const handleConfirm = async () => {
    if (!selectedId) return;
    try {
      await checkInParticipant(trainingCode, selectedId);
      logActivity({
        participantId: selectedId,
        panel: 'checkin',
        action: 'checked_in',
      });
      setCheckedInName(participants[selectedId]?.name || '');
      setPhase('done');
    } catch {
      setError('Nie udało się zameldować. Spróbuj ponownie.');
      setPhase('list');
    }
  };

  const handleCancel = () => {
    setSelectedId(null);
    setPhase('list');
  };

  const sorted = Object.entries(participants).sort(([, a], [, b]) =>
    a.name.localeCompare(b.name, 'pl'),
  );

  const checkedCount = Object.values(participants).filter((p) => p.checkedIn).length;
  const totalCount = Object.keys(participants).length;

  return (
    <div style={S.container}>
      <style>{STYLES}</style>

      <div style={S.header}>
        <div style={S.logo}>🎡 Wodzirej</div>
        {title && <div style={S.title}>{title}</div>}
      </div>

      {/* ── Loading ── */}
      {phase === 'loading' && (
        <div style={S.center}>
          <div style={S.spinner}>⏳</div>
          <p style={S.muted}>Łączenie z sesją...</p>
        </div>
      )}

      {/* ── Error ── */}
      {phase === 'error' && (
        <div style={S.center}>
          <div style={S.bigEmoji}>❌</div>
          <p style={S.errorText}>{error}</p>
        </div>
      )}

      {/* ── Closed ── */}
      {phase === 'closed' && (
        <div style={S.center}>
          <div style={S.bigEmoji}>🔒</div>
          <p style={S.muted}>Sesja szkoleniowa została zakończona</p>
        </div>
      )}

      {/* ── Participant list ── */}
      {phase === 'list' && (
        <>
          <div style={S.instruction}>
            <span style={S.instructionEmoji}>👋</span>
            <span>Znajdź swoje imię i tapnij, żeby się zameldować</span>
          </div>
          <div style={S.counter}>
            Zameldowani: {checkedCount} / {totalCount}
          </div>
          <div style={S.list}>
            {sorted.map(([id, p]) => (
              <button
                key={id}
                style={{
                  ...S.listItem,
                  ...(p.checkedIn ? S.listItemChecked : {}),
                }}
                onClick={() => !p.checkedIn && handleSelect(id)}
                disabled={p.checkedIn}
              >
                <span style={S.listIcon}>{p.checkedIn ? '✅' : '⬜'}</span>
                <span style={S.listName}>{p.name}</span>
                {p.checkedIn && <span style={S.listBadge}>zameldowany/a</span>}
              </button>
            ))}
          </div>
        </>
      )}

      {/* ── Confirm ── */}
      {phase === 'confirm' && selectedId && (
        <div style={S.center}>
          <div style={S.bigEmoji}>🤔</div>
          <p style={S.confirmQ}>
            Jesteś <strong>{participants[selectedId]?.name}</strong>?
          </p>
          <div style={S.confirmBtns}>
            <button style={S.btnPrimary} onClick={handleConfirm}>
              ✅ Tak, to ja!
            </button>
            <button style={S.btnSecondary} onClick={handleCancel}>
              ← Wróć
            </button>
          </div>
        </div>
      )}

      {/* ── Done ── */}
      {phase === 'done' && (
        <div style={S.center}>
          <div className="checkin-success-icon">✅</div>
          <p style={S.doneName}>{checkedInName}</p>
          <p style={S.doneMsg}>Zameldowany/a!</p>
          <p style={S.muted}>Możesz zamknąć tę stronę</p>
        </div>
      )}
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100dvh',
    background: '#0d0d0d',
    color: '#eee',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    textAlign: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  logo: {
    fontSize: 18,
    fontWeight: 700,
    color: '#e91e63',
  },
  title: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 4,
  },
  center: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    textAlign: 'center',
  },
  spinner: { fontSize: 40 },
  bigEmoji: { fontSize: 56 },
  muted: { color: '#888', fontSize: 14 },
  errorText: { color: '#f44336', fontSize: 16 },
  instruction: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'rgba(233, 30, 99, 0.1)',
    border: '1px solid rgba(233, 30, 99, 0.3)',
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 14,
    marginBottom: 8,
  },
  instructionEmoji: { fontSize: 20, flexShrink: 0 },
  counter: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginBottom: 8,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    flex: 1,
    overflowY: 'auto',
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 14px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    cursor: 'pointer',
    fontSize: 16,
    color: '#eee',
    textAlign: 'left',
    width: '100%',
    transition: 'background 0.15s',
  },
  listItemChecked: {
    opacity: 0.5,
    cursor: 'default',
    background: 'rgba(76, 175, 80, 0.08)',
    borderColor: 'rgba(76, 175, 80, 0.2)',
  },
  listIcon: { fontSize: 20, flexShrink: 0 },
  listName: { flex: 1, fontWeight: 600 },
  listBadge: {
    fontSize: 11,
    color: '#4caf50',
    background: 'rgba(76, 175, 80, 0.15)',
    padding: '2px 8px',
    borderRadius: 6,
  },
  confirmQ: { fontSize: 20, lineHeight: 1.4 },
  confirmBtns: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    width: '100%',
    maxWidth: 280,
    marginTop: 8,
  },
  btnPrimary: {
    padding: '14px 24px',
    fontSize: 16,
    fontWeight: 700,
    background: '#e91e63',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    cursor: 'pointer',
  },
  btnSecondary: {
    padding: '12px 24px',
    fontSize: 14,
    background: 'rgba(255,255,255,0.08)',
    color: '#aaa',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    cursor: 'pointer',
  },
  doneName: { fontSize: 24, fontWeight: 700 },
  doneMsg: { fontSize: 18, color: '#4caf50', fontWeight: 600 },
};

const STYLES = `
@keyframes checkin-pop {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); opacity: 1; }
}
.checkin-success-icon {
  font-size: 72px;
  animation: checkin-pop 0.5s ease-out;
}
`;
