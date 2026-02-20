import { useEffect } from 'react';
import { useStore } from './store';
import { Header } from './components/layout/Header';
import { ParticipantsPanel } from './components/participants/ParticipantsPanel';
import { GroupsPanel } from './components/groups/GroupsPanel';
import { WheelPanel } from './components/wheel/WheelPanel';
import { AboutPanel } from './components/about/AboutPanel';
import { Toasts } from './components/ui/Toast';
import './styles/globals.css';

// ── Hash-based routing: #about ↔ activeTab ──────────────────────────────────
const HASH_TABS = ['participants', 'groups', 'wheel', 'about'] as const;
type Tab = typeof HASH_TABS[number];

function hashToTab(hash: string): Tab {
  const slug = hash.replace('#', '');
  return (HASH_TABS as readonly string[]).includes(slug) ? (slug as Tab) : 'participants';
}

export default function App() {
  const activeTab = useStore((s) => s.activeTab);
  const setTab    = useStore((s) => s.setActiveTab);

  // On mount: read hash → set tab
  useEffect(() => {
    const tab = hashToTab(window.location.hash);
    if (tab !== activeTab) setTab(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When tab changes → update hash (no page reload)
  useEffect(() => {
    const newHash = activeTab === 'participants' ? '' : `#${activeTab}`;
    if (window.location.hash !== newHash) {
      history.replaceState(null, '', window.location.pathname + newHash);
    }
  }, [activeTab]);

  // Back/forward browser buttons
  useEffect(() => {
    const onPop = () => setTab(hashToTab(window.location.hash));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [setTab]);

  // W key triggers spin when on wheel tab
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if ((e.key === 'w' || e.key === 'W') && activeTab === 'wheel') {
        const spinBtn = Array.from(document.querySelectorAll<HTMLButtonElement>('.btn.primary'))
          .find((b) => b.textContent?.includes('ZAKRĘĆ') && !b.disabled);
        spinBtn?.click();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeTab]);

  return (
    <div className="app">
      <Header />
      <main style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {activeTab === 'participants' && <ParticipantsPanel />}
        {activeTab === 'groups'       && <GroupsPanel />}
        {activeTab === 'wheel'        && <WheelPanel />}
        {activeTab === 'about'        && <AboutPanel />}
      </main>
      <Toasts />
    </div>
  );
}
