import { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store';

export function Header() {
  const count     = useStore((s) => s.participants.length);
  const activeTab = useStore((s) => s.activeTab);
  const setTab    = useStore((s) => s.setActiveTab);
  const base      = import.meta.env.BASE_URL;

  const [popupOpen, setPopupOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close popup when clicking outside
  useEffect(() => {
    if (!popupOpen) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setPopupOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [popupOpen]);

  const goAbout = () => {
    setPopupOpen(false);
    setTab('about');
  };

  return (
    <>
      <header className="header">
        <div className="brand">🎡 Wodzirej</div>
        <div className="badge">GRUPY + KOŁO</div>

        {/* Author credit — klik otwiera popup chmurka */}
        <div className="author-credit" ref={wrapRef}>
          <span className="author-credit-static">Created &amp; designed by</span>
          <button
            className={`author-credit-link ${popupOpen ? 'open' : ''}`}
            onClick={() => setPopupOpen(v => !v)}
            title="O autorze — Sebastian Szajner"
            type="button"
          >
            <img
              src={`${base}author.jpg`}
              alt="Sebastian Szajner"
              className="author-avatar"
            />
            <span>Sebastian Szajner</span>
          </button>

          {/* Popup chmurka */}
          {popupOpen && (
            <div className="author-popup">
              <div className="author-popup-arrow" />
              <div className="author-popup-body">
                <img
                  src={`${base}author.jpg`}
                  alt="Sebastian Szajner"
                  className="author-popup-photo"
                />
                <div className="author-popup-text">
                  <strong className="author-popup-name">Sebastian Szajner</strong>
                  <span className="author-popup-role">Trener · Konsultant · Coach · Psycholog</span>
                  <p className="author-popup-bio">
                    Trener z ponad <strong>10-letnim doświadczeniem</strong> w L&amp;D,
                    ponad <strong>6&nbsp;000 godzin</strong> pracy warsztatowej.
                    Specjalizuje się w psychologii sprzedaży, przywództwie i efektywności osobistej.
                  </p>
                  <button
                    className="author-popup-btn"
                    onClick={goAbout}
                    type="button"
                  >
                    Więcej o mnie →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="spacer" />
        <div className="count-pill">
          {count === 0 ? 'Brak uczestników' : `${count} / 30 uczestników`}
        </div>
      </header>

      <nav className="tabs">
        {(['participants', 'groups', 'wheel'] as const).map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setTab(tab)}
          >
            {tab === 'participants' && '📋 Uczestnicy'}
            {tab === 'groups'       && '👥 Grupy'}
            {tab === 'wheel'        && '🎡 Koło fortuny'}
          </button>
        ))}

        {/* "O autorze" tab — avatar + label */}
        <button
          className={`tab-btn about-tab ${activeTab === 'about' ? 'active' : ''}`}
          onClick={() => setTab('about')}
          title="O autorze"
          type="button"
        >
          <img
            src={`${base}author.jpg`}
            alt="O autorze"
            className="tab-avatar"
          />
          <span className="tab-about-label">O autorze</span>
        </button>
      </nav>
    </>
  );
}
