import { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store';
import { ImportDropzone } from './ImportDropzone';
import { OcrDropzone } from './OcrDropzone';
import { isFirebaseConfigured } from '../../lib/firebase';
import { QRCodeSVG } from 'qrcode.react';
import {
  createSession,
  closeSession,
  getSessionURL,
  onSessionParticipants,
} from '../../lib/room';
import {
  createTraining,
  uploadParticipants,
  onCheckIns,
  closeTraining,
  getTrainingURL,
  getSavedTraining,
  clearTrainingLocal,
} from '../../lib/training';
import { setActiveTraining } from '../../lib/activityLog';

// ── Session persistence ──────────────────────────────────────────────────────
const REG_SESSION_KEY = 'wodzirej-reg-session';

function getSavedRegSession(): string | null {
  try { return localStorage.getItem(REG_SESSION_KEY); } catch { return null; }
}

// ── Manual Add Form ──────────────────────────────────────────────────────────

function ManualAddForm() {
  const addParticipants = useStore((s) => s.addParticipants);
  const count = useStore((s) => s.participants.length);
  const [first, setFirst] = useState('');
  const [last, setLast]   = useState('');
  const firstRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    const f = first.trim();
    if (f.length < 2) return;
    addParticipants([{ first: f, last: last.trim(), text: '' }]);
    setFirst('');
    setLast('');
    firstRef.current?.focus();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
  };

  const disabled = count >= 30;

  return (
    <div className="manual-add-wrap">
      <div className="manual-add-row">
        <input
          ref={firstRef}
          className="manual-input"
          placeholder="Imię *"
          value={first}
          onChange={e => setFirst(e.target.value)}
          onKeyDown={onKey}
          maxLength={40}
          disabled={disabled}
        />
        <input
          className="manual-input"
          placeholder="Nazwisko"
          value={last}
          onChange={e => setLast(e.target.value)}
          onKeyDown={onKey}
          maxLength={40}
          disabled={disabled}
        />
        <button
          className="btn primary sm manual-add-btn"
          onClick={handleAdd}
          disabled={disabled || first.trim().length < 2}
          type="button"
          title="Dodaj uczestnika"
        >
          + Dodaj
        </button>
      </div>
      {disabled && (
        <p className="manual-add-limit">Osiągnięto limit 30 uczestników</p>
      )}
    </div>
  );
}

// ── Session Export/Import ────────────────────────────────────────────────────

function SessionExportImport() {
  const participants = useStore((s) => s.participants);
  const groups = useStore((s) => s.groups);
  const scores = useStore((s) => s.scores);
  const scoreLog = useStore((s) => s.scoreLog);
  const spokeIds = useStore((s) => s.spokeIds);
  const addParticipants = useStore((s) => s.addParticipants);
  const showToast = useStore((s) => s.showToast);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      participants,
      groups,
      scores,
      scoreLog,
      spokeIds,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wodzirej-sesja-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Sesja wyeksportowana', 'success');
  };

  const handleSessionReport = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('pl-PL', { year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });

    const lines: string[] = [];
    lines.push('='.repeat(50));
    lines.push('RAPORT SESJI — Wodzirej');
    lines.push(`Data: ${dateStr}, ${timeStr}`);
    lines.push('='.repeat(50));
    lines.push('');

    // Participants
    lines.push(`UCZESTNICY (${participants.length})`);
    lines.push('-'.repeat(30));
    participants.forEach((p, i) => {
      lines.push(`  ${i + 1}. ${p.first}${p.last ? ' ' + p.last : ''}`);
    });
    lines.push('');

    // Groups
    if (groups.length > 0) {
      lines.push(`GRUPY (${groups.length})`);
      lines.push('-'.repeat(30));
      groups.forEach((g) => {
        lines.push(`  Grupa ${g.index}: ${g.members.map((m) => m.first + (m.last ? ' ' + m.last[0] + '.' : '')).join(', ')}`);
      });
      lines.push('');
    }

    // Scores ranking
    const ranked = [...participants].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));
    const hasScores = Object.values(scores).some((v) => v > 0);
    if (hasScores) {
      lines.push('RANKING PUNKTÓW');
      lines.push('-'.repeat(30));
      ranked.forEach((p, i) => {
        const pts = scores[p.id] || 0;
        const medal = i === 0 ? ' 🥇' : i === 1 ? ' 🥈' : i === 2 ? ' 🥉' : '';
        lines.push(`  ${i + 1}. ${p.first}${p.last ? ' ' + p.last : ''} — ${pts} pkt${medal}`);
      });
      lines.push('');
    }

    // Speaking activity
    if (spokeIds.length > 0) {
      lines.push('AKTYWNOŚĆ GŁOSOWA');
      lines.push('-'.repeat(30));
      const spokeSet = new Set(spokeIds);
      participants.forEach((p) => {
        const spoke = spokeSet.has(p.id);
        lines.push(`  ${spoke ? '✓' : '✗'} ${p.first}${p.last ? ' ' + p.last : ''}`);
      });
      lines.push(`  Łącznie: ${spokeIds.length}/${participants.length} wypowiedziało się`);
      lines.push('');
    }

    // Score log summary
    if (scoreLog.length > 0) {
      lines.push('PODSUMOWANIE AKTYWNOŚCI');
      lines.push('-'.repeat(30));
      lines.push(`  Łączna liczba akcji: ${scoreLog.length}`);
      const totalPts = Object.values(scores).reduce((s, v) => s + v, 0);
      lines.push(`  Łączna liczba punktów: ${totalPts}`);
      lines.push('');
    }

    lines.push('='.repeat(50));
    lines.push('Wygenerowano przez Wodzirej — narzędzie trenerskie');
    lines.push('='.repeat(50));

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wodzirej-raport-${now.toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Raport sesji wyeksportowany', 'success');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (data.participants && Array.isArray(data.participants)) {
          addParticipants(data.participants.map((p: { first: string; last: string; text: string }) => ({
            first: p.first || '',
            last: p.last || '',
            text: p.text || '',
          })));
          showToast(`Zaimportowano ${data.participants.length} uczestników`, 'success');
        }
      } catch {
        showToast('Błąd importu — niepoprawny plik JSON', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="session-export-row">
      <button className="btn sm" onClick={handleExport} disabled={participants.length === 0} title="Eksportuj sesję do JSON">
        💾 Eksport
      </button>
      <button className="btn sm" onClick={() => fileRef.current?.click()} title="Importuj sesję z JSON">
        📂 Import
      </button>
      <button className="btn sm" onClick={handleSessionReport} disabled={participants.length === 0} title="Eksportuj pełny raport sesji (TXT)">
        📦 Eksport sesji
      </button>
      <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
    </div>
  );
}

// ── QR Self-Registration ─────────────────────────────────────────────────────

function QRRegistration() {
  const addParticipants = useStore((s) => s.addParticipants);
  const showToast = useStore((s) => s.showToast);

  const [regSessionId, setRegSessionId] = useState<string | null>(getSavedRegSession());
  const [remoteP, setRemoteP] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const addedRef = useRef(new Set<string>());

  // Listen for new remote participants
  useEffect(() => {
    if (!regSessionId) return;
    const unsub = onSessionParticipants(regSessionId, (list) => {
      setRemoteP(list);
      // Auto-add new participants to Wodzirej
      for (const p of list) {
        if (!addedRef.current.has(p.id)) {
          addedRef.current.add(p.id);
          const parts = p.name.trim().split(/\s+/);
          const first = parts[0] || p.name;
          const last = parts.slice(1).join(' ');
          addParticipants([{ first, last, text: '' }]);
        }
      }
    });
    return () => unsub();
  }, [regSessionId, addParticipants]);

  const startReg = async () => {
    setLoading(true);
    try {
      const id = await createSession();
      setRegSessionId(id);
      localStorage.setItem(REG_SESSION_KEY, id);
      addedRef.current = new Set();
      showToast('Rejestracja QR aktywna — uczestnicy mogą się wpisywać', 'success');
    } catch {
      showToast('Błąd tworzenia sesji rejestracji', 'error');
    } finally {
      setLoading(false);
    }
  };

  const stopReg = async () => {
    if (regSessionId) {
      try { await closeSession(regSessionId); } catch {}
    }
    localStorage.removeItem(REG_SESSION_KEY);
    setRegSessionId(null);
    setRemoteP([]);
  };

  if (!regSessionId) {
    return (
      <button className="btn sm qr-reg-btn" onClick={startReg} disabled={loading}>
        {loading ? '⏳...' : '📱 Rejestracja QR'}
      </button>
    );
  }

  const url = getSessionURL(regSessionId);

  return (
    <div className="qr-reg-panel">
      <div className="qr-reg-header">
        <div className="qr-reg-badge">
          <span className="qr-reg-dot" />
          Rejestracja aktywna
        </div>
        <span className="qr-reg-count">{remoteP.length} dołączyło</span>
        <button className="btn sm danger" onClick={stopReg}>Zakończ</button>
      </div>
      <div className="qr-reg-body">
        <div className="qr-reg-qr">
          <QRCodeSVG value={url} size={140} bgColor="#fff" fgColor="#0f0f13" level="M" includeMargin />
        </div>
        <div className="qr-reg-info">
          <p className="qr-reg-instruction">Zeskanuj QR telefonem, aby się wpisać</p>
          <p className="qr-reg-code">Kod: <strong>{regSessionId}</strong></p>
          <p className="qr-reg-url">{url}</p>
        </div>
      </div>
    </div>
  );
}

// ── Training Session (check-in tracking) ────────────────────────────────────

function TrainingSession() {
  const participants = useStore((s) => s.participants);
  const showToast = useStore((s) => s.showToast);

  const [trainingCode, setTrainingCode] = useState<string | null>(() => {
    const saved = getSavedTraining();
    if (saved) setActiveTraining(saved.trainingCode);
    return saved?.trainingCode || null;
  });
  const [title, setTitle] = useState(() => getSavedTraining()?.title || '');
  const [checkIns, setCheckIns] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [showTitleInput, setShowTitleInput] = useState(false);

  // Real-time check-in listener
  useEffect(() => {
    if (!trainingCode) return;
    const unsub = onCheckIns(trainingCode, setCheckIns);
    return () => unsub();
  }, [trainingCode]);

  const checkedCount = Object.values(checkIns).filter(Boolean).length;

  const startTraining = async () => {
    if (participants.length === 0) {
      showToast('Najpierw dodaj uczestników', 'error');
      return;
    }
    setLoading(true);
    try {
      const code = await createTraining(title || undefined);
      await uploadParticipants(code, participants);
      setActiveTraining(code);
      setTrainingCode(code);
      showToast('Sesja szkoleniowa utworzona — uczestnicy mogą się meldować', 'success');
    } catch {
      showToast('Błąd tworzenia sesji szkoleniowej', 'error');
    } finally {
      setLoading(false);
    }
  };

  const stopTraining = async () => {
    if (!trainingCode) return;
    try {
      await closeTraining(trainingCode);
    } catch {}
    setActiveTraining(null);
    clearTrainingLocal();
    setTrainingCode(null);
    setCheckIns({});
    showToast('Sesja szkoleniowa zakończona', 'info');
  };

  // Not started yet
  if (!trainingCode) {
    return (
      <div className="training-session-start">
        {!showTitleInput ? (
          <button
            className="btn sm training-start-btn"
            onClick={() => setShowTitleInput(true)}
            disabled={participants.length === 0 || loading}
          >
            🎓 Rozpocznij szkolenie
          </button>
        ) : (
          <div className="training-title-row">
            <input
              className="manual-input"
              placeholder="Tytuł szkolenia (opcjonalnie)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && startTraining()}
              autoFocus
            />
            <button className="btn primary sm" onClick={startTraining} disabled={loading}>
              {loading ? '⏳...' : '▶ Start'}
            </button>
            <button className="btn sm" onClick={() => setShowTitleInput(false)}>✕</button>
          </div>
        )}
      </div>
    );
  }

  // Active training
  const url = getTrainingURL(trainingCode);

  return (
    <div className="training-session-panel">
      <div className="training-session-header">
        <div className="training-session-badge">
          <span className="training-dot" />
          Szkolenie aktywne
        </div>
        <span className="training-checkin-count">
          {checkedCount}/{participants.length} zameldowanych
        </span>
        <button className="btn sm danger" onClick={stopTraining}>Zakończ</button>
      </div>
      <div className="training-session-body">
        <div className="training-qr">
          <QRCodeSVG value={url} size={120} bgColor="#fff" fgColor="#0f0f13" level="M" includeMargin />
        </div>
        <div className="training-info">
          <p className="training-instruction">Uczestnicy skanują QR → znajdują siebie → meldują się</p>
          <p className="training-code">Kod: <strong>{trainingCode}</strong></p>
          {title && <p className="training-title-label">{title}</p>}
          <p className="training-url">{url}</p>
        </div>
      </div>
    </div>
  );
}

// ── Session Templates ────────────────────────────────────────────────────────

interface SessionTemplate {
  id: string;
  name: string;
  participants: Array<{ first: string; last: string; text: string }>;
  createdAt: number;
}

const TEMPLATES_KEY = 'wodzirej-templates';
const MAX_TEMPLATES = 10;

function loadTemplates(): SessionTemplate[] {
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SessionTemplate[];
    // Migration: add id/createdAt if missing from old format
    return parsed.map((t) => ({
      ...t,
      id: t.id || crypto.randomUUID(),
      createdAt: t.createdAt || (t as unknown as { timestamp?: number }).timestamp || Date.now(),
    }));
  } catch { return []; }
}

function saveTemplates(t: SessionTemplate[]) {
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(t));
}

function SessionTemplates() {
  const participants = useStore((s) => s.participants);
  const addParticipants = useStore((s) => s.addParticipants);
  const clearParticipants = useStore((s) => s.clearParticipants);
  const showToast = useStore((s) => s.showToast);

  const [templates, setTemplates] = useState<SessionTemplate[]>(loadTemplates);
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    if (participants.length === 0) {
      showToast('Najpierw dodaj uczestników', 'error');
      return;
    }
    if (templates.length >= MAX_TEMPLATES) {
      showToast(`Maksymalnie ${MAX_TEMPLATES} szablonów — usuń stary, by dodać nowy`, 'error');
      return;
    }
    const name = prompt('Nazwa szablonu:');
    if (!name?.trim()) return;
    const tpl: SessionTemplate = {
      id: crypto.randomUUID(),
      name: name.trim(),
      participants: participants.map((p) => ({ first: p.first, last: p.last, text: p.text })),
      createdAt: Date.now(),
    };
    const updated = [tpl, ...templates].slice(0, MAX_TEMPLATES);
    setTemplates(updated);
    saveTemplates(updated);
    showToast(`Szablon "${name.trim()}" zapisany`, 'success');
  };

  const handleLoad = (tpl: SessionTemplate) => {
    clearParticipants();
    setTimeout(() => {
      addParticipants(tpl.participants);
      showToast(`Załadowano szablon "${tpl.name}"`, 'success');
    }, 50);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Na pewno usunąć ten szablon?')) return;
    const updated = templates.filter((t) => t.id !== id);
    setTemplates(updated);
    saveTemplates(updated);
    showToast('Szablon usunięty', 'info');
  };

  const sectionStyle: React.CSSProperties = {
    border: '1px solid var(--line)',
    borderRadius: 8,
    overflow: 'hidden',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    cursor: 'pointer',
    background: 'var(--bg2)',
    userSelect: 'none',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--txt-main)',
  };

  const bodyStyle: React.CSSProperties = {
    padding: '8px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  };

  const templateRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 8px',
    borderRadius: 6,
    fontSize: 13,
    background: 'rgba(255,255,255,0.03)',
  };

  const templateInfoStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
  };

  const templateNameStyle: React.CSSProperties = {
    fontWeight: 600,
    color: 'var(--txt-main)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const templateMetaStyle: React.CSSProperties = {
    fontSize: 11,
    color: 'var(--txt-muted)',
  };

  const actionBtnStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 12,
    padding: '2px 6px',
    borderRadius: 4,
  };

  return (
    <div style={sectionStyle}>
      <div style={headerStyle} onClick={() => setOpen((v) => !v)}>
        <span>{open ? '▾' : '▸'} Szablony {templates.length > 0 ? `(${templates.length})` : ''}</span>
      </div>

      {open && (
        <div style={bodyStyle}>
          <button
            className="btn sm"
            onClick={handleSave}
            disabled={participants.length === 0}
            title="Zapisz obecną listę uczestników jako szablon"
            style={{ alignSelf: 'flex-start' }}
          >
            Zapisz jako szablon
          </button>

          {templates.length === 0 ? (
            <div style={{ color: 'var(--txt-muted)', fontSize: 12, padding: '4px 0' }}>
              Brak zapisanych szablonów.
            </div>
          ) : (
            templates.map((tpl) => (
              <div key={tpl.id} style={templateRowStyle}>
                <div style={templateInfoStyle}>
                  <div style={templateNameStyle}>{tpl.name}</div>
                  <div style={templateMetaStyle}>
                    {tpl.participants.length} uczestników | {new Date(tpl.createdAt).toLocaleDateString('pl-PL')}
                  </div>
                </div>
                <button
                  className="btn sm"
                  onClick={() => handleLoad(tpl)}
                  style={{ ...actionBtnStyle, color: 'var(--accent)', border: '1px solid var(--accent)' }}
                  title="Wczytaj uczestników z tego szablonu"
                >
                  Wczytaj
                </button>
                <button
                  onClick={() => handleDelete(tpl.id)}
                  style={{ ...actionBtnStyle, color: 'var(--txt-muted)' }}
                  title="Usuń szablon"
                >
                  Usuń
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Panel ───────────────────────────────────────────────────────────────

export function ParticipantsPanel() {
  const participants = useStore((s) => s.participants);
  const spokeIds = useStore((s) => s.spokeIds);
  const remove = useStore((s) => s.removeParticipant);
  const clear = useStore((s) => s.clearParticipants);
  const firebaseOk = isFirebaseConfigured();

  // Check-in state (shared via training session)
  const [checkIns, setCheckIns] = useState<Record<string, boolean>>({});
  const savedTraining = getSavedTraining();

  useEffect(() => {
    const code = savedTraining?.trainingCode;
    if (!code) { setCheckIns({}); return; }
    const unsub = onCheckIns(code, setCheckIns);
    return () => unsub();
  }, [savedTraining?.trainingCode]);

  const hasTraining = !!savedTraining?.trainingCode;

  return (
    <div className="panel">
      <div className="panel-body">
        <ManualAddForm />
        <ImportDropzone />
        <OcrDropzone />

        {/* QR Registration + Export/Import + Templates */}
        <div className="participants-actions-row">
          {firebaseOk && <QRRegistration />}
          <SessionTemplates />
          <div style={{ marginLeft: 'auto' }}>
            <SessionExportImport />
          </div>
        </div>

        {/* Training session (check-in + activity tracking) */}
        {firebaseOk && <TrainingSession />}

        <div className="plist-header">
          <h3>Uczestnicy ({participants.length}/30)</h3>
          {participants.length > 0 && (
            <button className="btn sm danger" onClick={clear}>Wyczyść</button>
          )}
        </div>

        {participants.length === 0 ? (
          <p style={{ color: 'var(--txt-muted)', fontSize: 12, textAlign: 'center', paddingTop: 20 }}>
            Brak uczestników — wpisz ręcznie, wgraj plik lub włącz rejestrację QR
          </p>
        ) : (
          <div>
            {participants.map((p, idx) => (
              <div className="participant-row" key={p.id}>
                <span className="num">{idx + 1}.</span>
                {hasTraining && (
                  <span
                    className={`checkin-dot ${checkIns[p.id] ? 'checked' : ''}`}
                    title={checkIns[p.id] ? 'Zameldowany' : 'Nie zameldowany'}
                  />
                )}
                <span className="name">
                  {p.first}
                  {p.last && <span className="last-name">{p.last}</span>}
                  {spokeIds.includes(p.id) && <span style={{opacity:0.5, fontSize:'0.8em', marginLeft: 4}}>🎤</span>}
                </span>
                <button
                  className="del-btn"
                  onClick={() => remove(p.id)}
                  title="Usuń"
                >×</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
