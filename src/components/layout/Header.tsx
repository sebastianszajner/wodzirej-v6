import { useStore } from '../../store';

export function Header() {
  const count     = useStore((s) => s.participants.length);
  const activeTab = useStore((s) => s.activeTab);
  const setTab    = useStore((s) => s.setActiveTab);

  return (
    <>
      <header className="header">
        <div className="brand">🎡 Wodzirej</div>
        <div className="badge">GRUPY + KOŁO</div>

        {/* Author credit */}
        <div className="author-credit">
          Created &amp; designed by{' '}
          <button
            className="author-credit-link"
            onClick={() => setTab('about')}
            title="O autorze"
          >
            Sebastian Szajner
          </button>
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

        {/* Subtle hidden "O autorze" tab — only highlighted when active */}
        <button
          className={`tab-btn about-tab ${activeTab === 'about' ? 'active' : ''}`}
          onClick={() => setTab('about')}
          title="O autorze"
        >
          👤
        </button>
      </nav>
    </>
  );
}
