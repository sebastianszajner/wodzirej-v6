import { useEffect, useState, useRef, useCallback } from 'react';
import { useStore } from './store';
import { ALL_TABS, type Tab } from './store/types';
import { saveSnapshot, loadLatestSnapshot, clearSnapshots } from './lib/persistence';
import { Header } from './components/layout/Header';
import { ParticipantsPanel } from './components/participants/ParticipantsPanel';
import { GroupsPanel } from './components/groups/GroupsPanel';
import { WheelPanel } from './components/wheel/WheelPanel';
import { ScorePanel } from './components/score/ScorePanel';
import { AboutPanel } from './components/about/AboutPanel';
import { TimerPanel } from './components/timer/TimerPanel';
import { PollPanel } from './components/poll/PollPanel';
import { IcebreakerPanel } from './components/icebreaker/IcebreakerPanel';
import { ParkingPanel } from './components/parking/ParkingPanel';
import { EnergyPanel } from './components/energy/EnergyPanel';
import { NoisePanel } from './components/noise/NoisePanel';
import { WordCloudPanel } from './components/wordcloud/WordCloudPanel';
import { RetroPanel } from './components/retro/RetroPanel';
import { QueuePanel } from './components/queue/QueuePanel';
import { AgendaPanel } from './components/agenda/AgendaPanel';
import { KahootPanel } from './components/kahoot/KahootPanel';
import { ReportPanel } from './components/report/ReportPanel';
import { ParticipantView } from './components/wordcloud/ParticipantView';
import { SessionJoinView } from './components/session/SessionJoinView';
import { CheckInView } from './components/checkin/CheckInView';
import { Toasts } from './components/ui/Toast';
import { TrainerNotes } from './components/ui/TrainerNotes';
import { undo, redo } from './lib/undoRedo';
import './styles/globals.css';

// ── Hash-based routing ──────────────────────────────────────────────────────

type RouteResult =
  | { type: 'tab'; tab: Tab }
  | { type: 'join'; roomId: string }
  | { type: 'session'; sessionId: string }
  | { type: 'checkin'; trainingCode: string };

function parseHash(hash: string): RouteResult {
  const raw = hash.replace('#', '');

  // Check for join/:roomId pattern (wordcloud)
  if (raw.startsWith('join/')) {
    const roomId = raw.slice(5);
    if (roomId) return { type: 'join', roomId };
  }

  // Check for checkin/:trainingCode pattern (training check-in)
  if (raw.startsWith('checkin/')) {
    const trainingCode = raw.slice(7);
    if (trainingCode) return { type: 'checkin', trainingCode };
  }

  // Check for session/:sessionId pattern (self-registration + quiz)
  if (raw.startsWith('session/')) {
    const sessionId = raw.slice(8);
    if (sessionId) return { type: 'session', sessionId };
  }

  // Normal tab routing
  const tab = (ALL_TABS as readonly string[]).includes(raw) ? (raw as Tab) : 'participants';
  return { type: 'tab', tab };
}

// ── Global keyboard shortcuts ───────────────────────────────────────────────

const TAB_SHORTCUTS: Record<string, Tab> = {
  '1': 'participants',
  '2': 'groups',
  '3': 'wheel',
  '4': 'score',
  '5': 'timer',
  '6': 'poll',
  '7': 'icebreaker',
  '8': 'energy',
  '9': 'queue',
};

const LETTER_SHORTCUTS: Record<string, Tab> = {
  q: 'queue',
  t: 'timer',
  p: 'poll',
  e: 'energy',
};

export default function App() {
  const activeTab = useStore((s) => s.activeTab);
  const setTab    = useStore((s) => s.setActiveTab);

  // Route state for participant/session/checkin views
  const [joinRoomId, setJoinRoomId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [trainingCode, setTrainingCode] = useState<string | null>(null);

  // Presentation mode
  const [presentationMode, setPresentationMode] = useState(false);

  // Keyboard help modal
  const [showShortcuts, setShowShortcuts] = useState(false);

  // ── IndexedDB auto-persistence ──────────────────────────────────────────────
  const [restoreBanner, setRestoreBanner] = useState<Record<string, unknown> | null>(null);
  const persistChecked = useRef(false);

  useEffect(() => {
    if (persistChecked.current) return;
    persistChecked.current = true;
    loadLatestSnapshot().then((snap) => {
      if (snap && Array.isArray(snap.participants) && snap.participants.length > 0) {
        setRestoreBanner(snap);
      }
    });
  }, []);

  const handleRestore = useCallback(() => {
    if (!restoreBanner) return;
    const snap = restoreBanner;
    useStore.setState({
      participants: snap.participants as never,
      groups: (snap.groups as never) || [],
      scores: (snap.scores as never) || {},
      scoreLog: (snap.scoreLog as never) || [],
      spokeIds: (snap.spokeIds as never) || [],
      activeTab: (ALL_TABS as readonly string[]).includes(snap.activeTab as string)
        ? (snap.activeTab as Tab)
        : useStore.getState().activeTab,
    });
    useStore.getState().resetWheelPool();
    setRestoreBanner(null);
    useStore.getState().showToast('Sesja przywrócona', 'success');
  }, [restoreBanner]);

  const handleDismissRestore = useCallback(() => {
    setRestoreBanner(null);
    clearSnapshots();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const s = useStore.getState();
      if (s.participants.length === 0) return;
      saveSnapshot({
        participants: s.participants,
        groups: s.groups,
        scores: s.scores,
        scoreLog: s.scoreLog,
        spokeIds: s.spokeIds,
        activeTab: s.activeTab,
      }).catch(() => {});
    }, 10_000);
    return () => clearInterval(interval);
  }, []);

  // On mount: read hash → set tab or join room/session
  useEffect(() => {
    const parsed = parseHash(window.location.hash);
    if (parsed.type === 'join') {
      setJoinRoomId(parsed.roomId);
    } else if (parsed.type === 'session') {
      setSessionId(parsed.sessionId);
    } else if (parsed.type === 'checkin') {
      setTrainingCode(parsed.trainingCode);
    } else {
      if (parsed.tab !== activeTab) setTab(parsed.tab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When tab changes → update hash (no page reload)
  useEffect(() => {
    if (joinRoomId || sessionId || trainingCode) return;
    const newHash = activeTab === 'participants' ? '' : `#${activeTab}`;
    if (window.location.hash !== newHash) {
      history.replaceState(null, '', window.location.pathname + newHash);
    }
  }, [activeTab, joinRoomId, sessionId, trainingCode]);

  // Back/forward browser buttons
  useEffect(() => {
    const onPop = () => {
      const parsed = parseHash(window.location.hash);
      if (parsed.type === 'join') {
        setJoinRoomId(parsed.roomId);
        setSessionId(null);
        setTrainingCode(null);
      } else if (parsed.type === 'session') {
        setSessionId(parsed.sessionId);
        setJoinRoomId(null);
        setTrainingCode(null);
      } else if (parsed.type === 'checkin') {
        setTrainingCode(parsed.trainingCode);
        setJoinRoomId(null);
        setSessionId(null);
      } else {
        setJoinRoomId(null);
        setSessionId(null);
        setTrainingCode(null);
        setTab(parsed.tab);
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [setTab]);

  // Global keyboard shortcuts
  useEffect(() => {
    if (joinRoomId || sessionId || trainingCode) return;
    const handler = (e: KeyboardEvent) => {
      // Ctrl+Z / Ctrl+Shift+Z — undo/redo (works even in inputs)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
        return;
      }

      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      // ? (Shift+/) → toggle keyboard help modal
      if (e.key === '?' && e.shiftKey) {
        e.preventDefault();
        setShowShortcuts((v) => !v);
        return;
      }

      // Escape → close shortcuts modal or exit presentation
      if (e.key === 'Escape') {
        if (showShortcuts) { setShowShortcuts(false); return; }
        if (presentationMode) { setPresentationMode(false); return; }
        return;
      }

      // Alt+1..9 → tab shortcuts
      if (e.altKey && TAB_SHORTCUTS[e.key]) {
        e.preventDefault();
        setTab(TAB_SHORTCUTS[e.key]);
        return;
      }

      // Space → context-aware action
      if (e.key === ' ' && !e.altKey && !e.ctrlKey) {
        if (activeTab === 'wheel') {
          e.preventDefault();
          const spinBtn = Array.from(document.querySelectorAll<HTMLButtonElement>('.btn.primary'))
            .find((b) => b.textContent?.includes('ZAKRĘĆ') && !b.disabled);
          spinBtn?.click();
          return;
        }
        if (activeTab === 'queue') {
          e.preventDefault();
          const queueBtn = Array.from(document.querySelectorAll<HTMLButtonElement>('.btn.primary, .btn.success'))
            .find((b) => !b.disabled && (b.textContent?.includes('Start') || b.textContent?.includes('Następny') || b.textContent?.includes('Next')));
          queueBtn?.click();
          return;
        }
      }

      // W → spin wheel (keep legacy)
      if ((e.key === 'w' || e.key === 'W') && activeTab === 'wheel' && !e.altKey && !e.ctrlKey) {
        const spinBtn = Array.from(document.querySelectorAll<HTMLButtonElement>('.btn.primary'))
          .find((b) => b.textContent?.includes('ZAKRĘĆ') && !b.disabled);
        spinBtn?.click();
        return;
      }

      // F → toggle presentation mode
      if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.altKey) {
        setPresentationMode((v) => !v);
        return;
      }

      // Letter shortcuts (no modifier) → switch tabs
      const lower = e.key.toLowerCase();
      if (!e.altKey && !e.ctrlKey && !e.metaKey && LETTER_SHORTCUTS[lower]) {
        setTab(LETTER_SHORTCUTS[lower]);
        return;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeTab, joinRoomId, sessionId, trainingCode, presentationMode, showShortcuts, setTab]);

  // ── Participant join view (mobile — wordcloud) ──
  if (joinRoomId) {
    return <ParticipantView roomId={joinRoomId} />;
  }

  // ── Session join view (mobile — self-registration + quiz) ──
  if (sessionId) {
    return <SessionJoinView sessionId={sessionId} />;
  }

  // ── Training check-in view (mobile — participant check-in) ──
  if (trainingCode) {
    return <CheckInView trainingCode={trainingCode} />;
  }

  // ── Main app view (trainer) ──
  return (
    <div className={`app ${presentationMode ? 'presentation-mode' : ''}`}>
      {/* ── Restore session banner ── */}
      {restoreBanner && (
        <div style={{
          background: 'var(--input-bg)', borderBottom: '1px solid var(--line)',
          padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 12,
          fontSize: 13, zIndex: 100,
        }}>
          <span style={{ color: 'var(--txt-main)' }}>Znaleziono poprzednią sesję ({(restoreBanner.participants as unknown[]).length} uczestników).</span>
          <button className="btn sm primary" onClick={handleRestore}>Wznów</button>
          <button className="btn sm" onClick={handleDismissRestore}>Odrzuć</button>
        </div>
      )}
      {!presentationMode && <Header />}
      <main style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {activeTab === 'participants' && <ParticipantsPanel />}
        {activeTab === 'groups'       && <GroupsPanel />}
        {activeTab === 'wheel'        && <WheelPanel />}
        {activeTab === 'score'        && <ScorePanel />}
        {activeTab === 'timer'        && <TimerPanel />}
        {activeTab === 'poll'         && <PollPanel />}
        {activeTab === 'icebreaker'   && <IcebreakerPanel />}
        {activeTab === 'parking'      && <ParkingPanel />}
        {activeTab === 'energy'       && <EnergyPanel />}
        {activeTab === 'noise'        && <NoisePanel />}
        {activeTab === 'wordcloud'    && <WordCloudPanel />}
        {activeTab === 'retro'        && <RetroPanel />}
        {activeTab === 'queue'        && <QueuePanel />}
        {activeTab === 'agenda'       && <AgendaPanel />}
        {activeTab === 'kahoot'       && <KahootPanel />}
        {activeTab === 'report'       && <ReportPanel />}
        {activeTab === 'about'        && <AboutPanel />}
      </main>
      {presentationMode && (
        <button
          className="presentation-exit-btn"
          onClick={() => setPresentationMode(false)}
          title="Wyjdź z trybu prezentacji (F)"
        >
          ESC
        </button>
      )}
      {showShortcuts && (
        <div className="shortcuts-overlay" onClick={() => setShowShortcuts(false)}>
          <div className="shortcuts-modal" onClick={(e) => e.stopPropagation()}>
            <div className="shortcuts-header">
              <h2>Skróty klawiszowe</h2>
              <button className="shortcuts-close" onClick={() => setShowShortcuts(false)}>✕</button>
            </div>
            <div className="shortcuts-grid">
              <div className="shortcuts-section">
                <h3>Zakładki (Alt + cyfra)</h3>
                <div className="shortcut-row"><kbd>Alt+1</kbd><span>Uczestnicy</span></div>
                <div className="shortcut-row"><kbd>Alt+2</kbd><span>Grupy</span></div>
                <div className="shortcut-row"><kbd>Alt+3</kbd><span>Koło fortuny</span></div>
                <div className="shortcut-row"><kbd>Alt+4</kbd><span>Ranking</span></div>
                <div className="shortcut-row"><kbd>Alt+5</kbd><span>Timer</span></div>
                <div className="shortcut-row"><kbd>Alt+6</kbd><span>Głosowanie</span></div>
                <div className="shortcut-row"><kbd>Alt+7</kbd><span>Lodołamacz</span></div>
                <div className="shortcut-row"><kbd>Alt+8</kbd><span>Energia</span></div>
                <div className="shortcut-row"><kbd>Alt+9</kbd><span>Kolejka</span></div>
              </div>
              <div className="shortcuts-section">
                <h3>Szybkie przełączanie</h3>
                <div className="shortcut-row"><kbd>Q</kbd><span>Kolejka</span></div>
                <div className="shortcut-row"><kbd>T</kbd><span>Timer</span></div>
                <div className="shortcut-row"><kbd>P</kbd><span>Głosowanie</span></div>
                <div className="shortcut-row"><kbd>E</kbd><span>Energia</span></div>
              </div>
              <div className="shortcuts-section">
                <h3>Akcje</h3>
                <div className="shortcut-row"><kbd>W</kbd><span>Zakręć kołem</span></div>
                <div className="shortcut-row"><kbd>Space</kbd><span>Zakręć / następny mówca</span></div>
                <div className="shortcut-row"><kbd>F</kbd><span>Tryb prezentacji</span></div>
                <div className="shortcut-row"><kbd>Ctrl+Z</kbd><span>Cofnij</span></div>
                <div className="shortcut-row"><kbd>Ctrl+Shift+Z</kbd><span>Ponów</span></div>
                <div className="shortcut-row"><kbd>Esc</kbd><span>Zamknij / wyjdź</span></div>
                <div className="shortcut-row"><kbd>?</kbd><span>Pokaż/ukryj tę pomoc</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
      <Toasts />
      <TrainerNotes />
    </div>
  );
}
