import { useStore } from '../../store';

export function Header() {
  const count     = useStore((s) => s.participants.length);
  const activeTab = useStore((s) => s.activeTab);
  const setTab    = useStore((s) => s.setActiveTab);

  const base = import.meta.env.BASE_URL;

  return (
    <>
      <header className="header">
        <div className="brand">🎡 Wodzirej</div>
        <div className="badge">GRUPY + KOŁO</div>

        {/* Author credit with avatar */}
        <div className="author-credit">
          Created &amp; designed by{' '}
          <a
            href={`${base}#about`}
            className={`author-credit-link ${activeTab === 'about' ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); setTab('about'); }}
            title="O autorze — Sebastian Szajner"
          >
            <img
              src={`${base}author.jpg`}
              alt="Sebastian Szajner"
              className="author-avatar"
            />
            <span>Sebastian Szajner</span>
          </a>
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

        {/* "O autorze" tab — avatar icon */}
        <a
          href={`${base}#about`}
          className={`tab-btn about-tab ${activeTab === 'about' ? 'active' : ''}`}
          onClick={(e) => { e.preventDefault(); setTab('about'); }}
          title="O autorze"
        >
          <img
            src={`${base}author.jpg`}
            alt="O autorze"
            className="tab-avatar"
          />
          <span className="tab-about-label">O autorze</span>
        </a>
      </nav>
    </>
  );
}
