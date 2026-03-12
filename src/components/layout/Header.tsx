import { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store';
import { useEnabledTabs } from '../../store/settings';
import { CORE_TABS, EXTRA_TABS, TAB_META } from '../../store/types';

const CORE_META: Record<string, { emoji: string; label: string }> = {
  participants: { emoji: '📋', label: 'Uczestnicy' },
  groups:       { emoji: '👥', label: 'Grupy' },
  wheel:        { emoji: '🎡', label: 'Koło fortuny' },
  score:        { emoji: '🏆', label: 'Ranking' },
};

export function Header() {
  const count     = useStore((s) => s.participants.length);
  const activeTab = useStore((s) => s.activeTab);
  const setTab    = useStore((s) => s.setActiveTab);
  const base      = import.meta.env.BASE_URL;
  const { toggle, isEnabled } = useEnabledTabs();

  const [popupOpen, setPopupOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  // ── Session timer ───────────────────────────────────────────────────────
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    const SK = 'wodzirej-session-start';

    if (count > 0) {
      if (!localStorage.getItem(SK)) {
        localStorage.setItem(SK, String(Date.now()));
      }
    } else {
      localStorage.removeItem(SK);
      setElapsed('');
      return;
    }

    const update = () => {
      const start = Number(localStorage.getItem(SK));
      if (!start) { setElapsed(''); return; }
      const diff = Math.floor((Date.now() - start) / 60000);
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      setElapsed(`${h}:${String(m).padStart(2, '0')}`);
    };

    update();
    const iv = setInterval(update, 60000);
    return () => clearInterval(iv);
  }, [count]);

  // ── Light mode toggle ──────────────────────────────────────────────────
  const [lightMode, setLightMode] = useState(() => {
    return localStorage.getItem('wodzirej-theme') === 'light';
  });

  useEffect(() => {
    if (lightMode) {
      document.documentElement.classList.add('light-mode');
      localStorage.setItem('wodzirej-theme', 'light');
    } else {
      document.documentElement.classList.remove('light-mode');
      localStorage.setItem('wodzirej-theme', 'dark');
    }
  }, [lightMode]);

  // Close popup when clicking outside
  useEffect(() => {
    if (!popupOpen && !settingsOpen) return;
    const handler = (e: MouseEvent) => {
      if (popupOpen && wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setPopupOpen(false);
      }
      if (settingsOpen && settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [popupOpen, settingsOpen]);

  const goAbout = () => {
    setPopupOpen(false);
    setTab('about');
  };

  // Visible extra tabs (only enabled ones)
  const visibleExtra = EXTRA_TABS.filter((t) => isEnabled(t));

  // Auto-compact: icon-only when too many tabs to fit without scrolling
  const totalTabs = CORE_TABS.length + visibleExtra.length + 1; // +1 for "about"
  const compact = totalTabs > 6;

  return (
    <>
      <header className="header">
        <div className="brand">🎡 Wodzirej</div>
        <div className="badge">NARZĘDZIA TRENERSKIE</div>

        {/* Author credit */}
        <div className="author-credit" ref={wrapRef}>
          <span className="author-credit-static">Created &amp; designed by</span>
          <button
            className={`author-credit-link ${popupOpen ? 'open' : ''}`}
            onClick={() => setPopupOpen(v => !v)}
            title="O autorze — Sebastian Szajner"
            type="button"
          >
            <img src={`${base}author.jpg`} alt="Sebastian Szajner" className="author-avatar" />
            <span>Sebastian Szajner</span>
          </button>

          {popupOpen && (
            <div className="author-popup">
              <div className="author-popup-arrow" />
              <div className="author-popup-body">
                <img src={`${base}author.jpg`} alt="Sebastian Szajner" className="author-popup-photo" />
                <div className="author-popup-text">
                  <strong className="author-popup-name">Sebastian Szajner</strong>
                  <span className="author-popup-role">Trener · Coach · Psycholog</span>
                  <p className="author-popup-bio">
                    <strong>10+ lat</strong> w L&amp;D · <strong>6&nbsp;000h</strong> warsztatów
                  </p>
                  <div className="author-popup-actions">
                    <button className="author-popup-btn" onClick={goAbout} type="button">O mnie →</button>
                    <a className="author-popup-btn author-popup-btn--li" href="https://www.linkedin.com/in/sebastian-szajner/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="spacer" />

        {/* Theme toggle */}
        <button
          className="theme-toggle"
          onClick={() => setLightMode(v => !v)}
          title={lightMode ? 'Tryb ciemny' : 'Tryb jasny'}
          type="button"
        >
          {lightMode ? '☀️' : '🌙'}
        </button>

        {/* Settings gear */}
        <div className="settings-wrap" ref={settingsRef}>
          <button
            className={`settings-gear ${settingsOpen ? 'open' : ''}`}
            onClick={() => setSettingsOpen(v => !v)}
            title="Zarządzaj zakładkami"
            type="button"
          >
            ⚙️
          </button>

          {settingsOpen && (
            <div className="settings-popup">
              <div className="settings-popup-title">Zakładki</div>
              <div className="settings-popup-hint">Włącz/wyłącz narzędzia</div>
              <div className="settings-list">
                {EXTRA_TABS.map((tab) => {
                  const meta = TAB_META[tab];
                  const on = isEnabled(tab);
                  return (
                    <label key={tab} className={`settings-item ${on ? 'on' : ''}`}>
                      <span className="settings-item-emoji">{meta.emoji}</span>
                      <span className="settings-item-info">
                        <span className="settings-item-label">{meta.label}</span>
                        <span className="settings-item-desc">{meta.desc}</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggle(tab)}
                        className="settings-toggle"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="count-pill">
          {count === 0 ? 'Brak uczestników' : `${count} / 30 uczestników`}
          {elapsed && <span className="session-timer">🕐 {elapsed}</span>}
        </div>
      </header>

      <nav className={`tabs ${compact ? 'tabs--compact' : ''}`}>
        {/* Core tabs — always visible */}
        {CORE_TABS.map((tab) => {
          const isActive = activeTab === tab;
          const meta = CORE_META[tab];
          return (
            <button
              key={tab}
              className={`tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => setTab(tab)}
              title={compact && !isActive ? meta.label : undefined}
            >
              <span className="tab-emoji">{meta.emoji}</span>
              <span className="tab-label">{meta.label}</span>
            </button>
          );
        })}

        {/* Extra tabs — only enabled ones */}
        {visibleExtra.map((tab) => {
          const isActive = activeTab === tab;
          const meta = TAB_META[tab];
          return (
            <button
              key={tab}
              className={`tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => setTab(tab)}
              title={compact && !isActive ? meta.label : undefined}
            >
              <span className="tab-emoji">{meta.emoji}</span>
              <span className="tab-label">{meta.label}</span>
            </button>
          );
        })}

        {/* "O autorze" tab — avatar + label */}
        <button
          className={`tab-btn about-tab ${activeTab === 'about' ? 'active' : ''}`}
          onClick={() => setTab('about')}
          title="O autorze"
          type="button"
        >
          <img src={`${base}author.jpg`} alt="O autorze" className="tab-avatar" />
          <span className="tab-label tab-about-label">O autorze</span>
        </button>
      </nav>
    </>
  );
}
