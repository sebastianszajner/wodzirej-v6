// ── Co mnie napędza — kluczowe motywatory ────────────────────────────────────
const DRIVES = [
  {
    icon: '🏆',
    label: 'Uznanie & Status',
    bar: 100,
    color: '#e91e63',
    desc: 'Potrzebuję wiedzieć, że moja praca ma znaczenie i jest dostrzegana. Status nie jest celem samym w sobie — to informacja zwrotna, że idę we właściwym kierunku.',
  },
  {
    icon: '💡',
    label: 'Idealizm & Misja',
    bar: 100,
    color: '#9c27b0',
    desc: 'Działam z poczuciem sensu. Muszę wierzyć, że to co robię zmienia coś na lepsze — u ludzi, w organizacji, w świecie.',
  },
  {
    icon: '⚡',
    label: 'Władza & Wpływ',
    bar: 90,
    color: '#ff9800',
    desc: 'Naturalnie przejmuję inicjatywę. Nie po to, by kontrolować — po to, by rzeczy się działy. Brak sprawczości działa na mnie demotywująco.',
  },
  {
    icon: '🔍',
    label: 'Ciekawość & Rozwój',
    bar: 90,
    color: '#2196f3',
    desc: 'Potrzeba ciągłego uczenia się to mój motor. Nowe idee, nowe dziedziny, intelektualne dyskusje — to mnie ładuje, nie wyczerpuje.',
  },
  {
    icon: '🌊',
    label: 'Napięcie, nie spokój',
    bar: 85,
    color: '#00bcd4',
    desc: 'Działam najlepiej pod presją i w zmiennym środowisku. Cisza i rutyna mnie nie relaksują — to wyzwania i złożone zadania dają mi energię.',
  },
];

// ── Jak funkcjonuję z ludźmi ─────────────────────────────────────────────────
const PEOPLE = [
  { icon: '🤝', label: 'Zaufanie jako default', desc: 'Wychodzę z założenia, że ludzie są szczerzy i dobrzy w intencjach. Daję kredyt zaufania — i oczekuję tego samego.' },
  { icon: '❤️', label: 'Wrażliwość społeczna', desc: 'Ciężko mi przejść obojętnie obok kogoś w potrzebie. Angażuję się w sprawy innych — to naturalne, nie wykalkulowane.' },
  { icon: '⚔️', label: 'Komfort w konflikcie', desc: 'Nie uciekam od trudnych rozmów. Konfrontacja nie jest dla mnie zagrożeniem — to narzędzie do rozwiązywania problemów.' },
  { icon: '🔄', label: 'Mediator & Partner', desc: 'Szukam rozwiązań korzystnych dla obu stron. Praca zarówno samodzielna, jak i zespołowa przychodzi mi naturalnie.' },
];

// ── Jak myślę i działam ──────────────────────────────────────────────────────
const THINKING = [
  { icon: '🎯', label: 'Wytrwałość w obliczu przeszkód', pct: 92 },
  { icon: '🧩', label: 'Wszechstronna ciekawość intelektualna', pct: 98 },
  { icon: '🚀', label: 'Inicjatywa i samomotywacja', pct: 90 },
  { icon: '🎨', label: 'Otwartość — nowe idee i doświadczenia', pct: 98 },
  { icon: '🔬', label: 'Refleksyjność i wieloperspektywowość', pct: 95 },
  { icon: '🛠️', label: 'Coaching i praca jeden na jeden', pct: 82 },
];

// ── Podejście do procesu grupowego ───────────────────────────────────────────
const GROUP_PROCESS = [
  {
    icon: '🎲',
    title: 'Losowość jako narzędzie, nie chaos',
    desc: 'Podział na grupy i losowanie uczestników to nie tylko "kto z kim" — to świadoma interwencja w dynamikę grupy. Losowość rozbija nieformalne koalicje, wymusza nowe perspektywy i tworzy warunki do autentycznej współpracy.',
  },
  {
    icon: '🌡️',
    title: 'Temperatura grupy',
    desc: 'Na każdym etapie warsztatu monitoruję poziom energii, napięcia i zaangażowania. Wiem, kiedy przyspieszyć, kiedy zwolnić — i kiedy potrzebny jest reset. Narzędzia jak losowanie czy koło fortuny pomagają zmieniać rytm i utrzymywać uwagę.',
  },
  {
    icon: '🧱',
    title: 'Fazy grupowe — od formowania do działania',
    desc: 'Grupy przechodzą przez przewidywalne fazy: forming → storming → norming → performing. Dobry trener nie omija "stormingu" — pomaga grupie przez niego przejść. Losuję, mieszam składy i prowokuję dialog właśnie wtedy, gdy jest to najbardziej potrzebne.',
  },
  {
    icon: '🎯',
    title: 'Struktura, która uwalnia',
    desc: 'Paradoks procesu grupowego: im lepsza struktura, tym więcej swobody twórczej. Jasne zasady losowania, przejrzyste reguły gry i przewidywalny rytm dają uczestnikom poczucie bezpieczeństwa — i przestrzeń do autentycznego zaangażowania.',
  },
  {
    icon: '👁️',
    title: 'Uważność na to, co niewidoczne',
    desc: 'Dynamika grupy dzieje się zarówno w słowach, jak i między nimi. Obserwuję, kto milczy, kto dominuje, jakie nieformalne role się tworzą. Narzędzia losowania pomagają mi jako trenerowi — bez tłumaczenia się — zmienić układ sił i dać głos tym, którzy go nie zabierają.',
  },
];

// ── Klienci według sektorów ──────────────────────────────────────────────────
const CLIENTS: { sector: string; icon: string; names: string[] }[] = [
  {
    sector: 'Bankowość & Finanse',
    icon: '🏦',
    names: ['AASA Poland', 'Alior Bank', 'Aviva', 'Bank BPH', 'Noble Bank', 'PKO Bank Polski'],
  },
  {
    sector: 'Consulting & Doradztwo',
    icon: '💼',
    names: ['Capgemini', 'Certes', 'Deloitte', 'House of Skills', 'McKinsey & Company', 'Teamformacja'],
  },
  {
    sector: 'FMCG & Retail',
    icon: '🛒',
    names: ['Allegro', 'Danone', 'Empik', 'Intersnack', 'Japan Tobacco International (JTI)', 'Lidl', 'L\'Oréal', 'Philip Morris Polska', 'Tobacco Trading International (TTI)'],
  },
  {
    sector: 'IT, E-commerce & Technologie',
    icon: '💻',
    names: ['Atman', 'CERI', 'InPost', 'Packhelp', 'Solenerga'],
  },
  {
    sector: 'Motoryzacja & Wynajem',
    icon: '🚗',
    names: ['99Rent'],
  },
  {
    sector: 'Ochrona Zdrowia & Farmacja',
    icon: '💊',
    names: ['Apteki DOZ', 'Benefit System', 'Narodowy Fundusz Zdrowia (NFZ)'],
  },
  {
    sector: 'Rekrutacja & HR',
    icon: '👔',
    names: ['Adecco', 'Agility', 'Antal', 'Helpea'],
  },
  {
    sector: 'Ubezpieczenia',
    icon: '🛡️',
    names: ['Generali'],
  },
  {
    sector: 'Dystrybucja & Logistyka',
    icon: '📦',
    names: ['Lyreco', 'NEINVER', 'Orange'],
  },
  {
    sector: 'Administracja publiczna & NGO',
    icon: '🏛️',
    names: [
      'Akademia PAN (Fundacja Polskiej Akademii Nauk)',
      'Akademia Przyszłości',
      'Fundacja im. Lesława Pagi',
      'Fundacja Rozwoju Przedsiębiorczości „Twój Startup"',
      'ISCH',
      'Ministerstwo Środowiska',
      'Ministerstwo Sprawiedliwości',
      'Szkoła Główna Gospodarstwa Wiejskiego (SGGW)',
      'Wszechnica UJ',
    ],
  },
  {
    sector: 'Coachin & Szkolenia',
    icon: '🎓',
    names: ['4-Eco', 'Polska Izba Firm Szkoleniowych'],
  },
];

function DriveBar({ icon, label, bar, color, desc }: typeof DRIVES[0]) {
  return (
    <div className="drive-item">
      <div className="drive-top">
        <span className="drive-icon">{icon}</span>
        <span className="drive-label">{label}</span>
        <div className="drive-track">
          <div className="drive-fill" style={{ width: `${bar}%`, background: color }} />
        </div>
      </div>
      <p className="drive-desc">{desc}</p>
    </div>
  );
}

function ThinkingBar({ icon, label, pct }: typeof THINKING[0]) {
  return (
    <div className="rmp-row">
      <span className="rmp-label" style={{ width: 'auto', flex: 1, textAlign: 'left' }}>
        {icon} {label}
      </span>
      <div className="rmp-track" style={{ width: 80, flexShrink: 0 }}>
        <div className="rmp-fill" style={{ width: `${pct}%`, background: '#4caf50' }} />
      </div>
      <span className="rmp-val">{pct}%</span>
    </div>
  );
}

export function AboutPanel() {
  return (
    <div className="panel">
      <div className="panel-body about-body">

        {/* ── Hero card ──────────────────────────────────────────────────── */}
        <div className="about-card">
          <div className="about-photo-wrap">
            <img
              src={`${import.meta.env.BASE_URL}author.jpg`}
              alt="Sebastian Szajner"
              className="about-photo"
            />
          </div>

          <div className="about-content">
            <h2 className="about-name">Sebastian Szajner</h2>
            <p className="about-role">Trener · Konsultant · Coach · Psycholog</p>

            <div className="about-tags">
              {['C-level','N-1 / N-2','Zarządzanie','Przywództwo',
                'Psychologia sprzedaży','Efektywność osobista','AI w biznesie'].map(t => (
                <span key={t} className="about-tag">{t}</span>
              ))}
            </div>

            <p className="about-desc">
              Trener i konsultant z ponad <strong>10-letnim doświadczeniem</strong> w obszarze
              szkoleń i rozwoju (L&amp;D). Wcześniej pracował bezpośrednio w sprzedaży
              (m.in. Noble Bank), przeszedł pełną ścieżkę — od trenera wewnętrznego,
              przez L&amp;D Experta i Senior Trenera Sprzedaży, po Kierownika Szkoleń.
            </p>
            <p className="about-desc">
              Specjalizuje się w szkoleniach z zakresu <strong>psychologii sprzedaży</strong>,{' '}
              <strong>efektywności osobistej</strong> i <strong>zarządzania</strong>.
              Ponad <strong>6 000 godzin</strong> pracy warsztatowej. Od 2023 roku szkoli
              działy sprzedaży z <strong>efektywnego użycia AI</strong>. Prowadzi szkolenia
              w języku polskim i angielskim.
            </p>
          </div>
        </div>

        {/* ── Podejście do procesu grupowego ────────────────────────────── */}
        <div className="about-section-title">Podejście do procesu grupowego</div>
        <p className="about-intro-text">
          Warsztat to żywy organizm. To, co dzieje się między ludźmi — dynamika, napięcia,
          energie — ma równie duże znaczenie jak treść merytoryczna. Poniżej kilka zasad,
          którymi kieruję się podczas pracy z grupą.
        </p>
        <div className="group-process-grid">
          {GROUP_PROCESS.map(item => (
            <div key={item.title} className="group-process-card">
              <div className="group-process-icon">{item.icon}</div>
              <div>
                <strong className="group-process-title">{item.title}</strong>
                <p className="group-process-desc">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Profil osobowościowy ──────────────────────────────────────── */}
        <div className="about-section-title">Kim jestem — profil osobowościowy</div>
        <p className="about-intro-text">
          Poniższy opis powstał na podstawie kilku badań psychometrycznych z ostatnich lat.
          To nie są wyniki testów — to <strong>obraz tego, jak naprawdę funkcjonuję</strong>,
          co mnie napędza i jak wchodzę w relacje. Warto to znać, żeby dobrze ze mną
          współpracować.
        </p>

        <div className="about-psych-grid">

          {/* Co mnie napędza */}
          <div className="about-psych-card about-psych-card--wide">
            <div className="about-psych-header">
              <span className="about-psych-badge rmp-badge">🔥 Motywacja</span>
              <span className="about-psych-name">Co mnie napędza do działania</span>
            </div>
            <div className="drives-list">
              {DRIVES.map(d => <DriveBar key={d.label} {...d} />)}
            </div>
          </div>

          {/* Jak funkcjonuję z ludźmi */}
          <div className="about-psych-card">
            <div className="about-psych-header">
              <span className="about-psych-badge perso-badge">👥 Relacje</span>
              <span className="about-psych-name">Jak funkcjonuję z ludźmi</span>
            </div>
            <div className="people-chips">
              {PEOPLE.map(p => (
                <div key={p.label} className="people-chip">
                  <span className="people-icon">{p.icon}</span>
                  <div>
                    <strong>{p.label}</strong>
                    <p>{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Jak myślę i działam */}
          <div className="about-psych-card">
            <div className="about-psych-header">
              <span className="about-psych-badge harrison-badge">🧠 Styl działania</span>
              <span className="about-psych-name">Jak myślę i działam</span>
            </div>
            <p className="about-psych-desc">
              Niekonwencjonalny, otwarty na nowe doświadczenia — w górnym percentylu populacji.
              Unikam rutyny, chętnie wchodzę w intelektualne spory i eksperymentuję.
              Wyróżnia mnie duża wrażliwość emocjonalna połączona z komfortem w trudnych sytuacjach.
            </p>
            <div className="rmp-bars">
              {THINKING.map(t => <ThinkingBar key={t.label} {...t} />)}
            </div>
          </div>

        </div>

        {/* ── Klienci według sektorów ────────────────────────────────────── */}
        <div className="about-section-title">Wybrani klienci — według branż</div>
        <p className="about-intro-text">
          Ponad 10 lat pracy z organizacjami z różnych sektorów. Poniżej wybrane firmy
          i instytucje, z którymi współpracowałem.
        </p>
        <div className="clients-sectors">
          {CLIENTS.map(sector => (
            <div key={sector.sector} className="clients-sector">
              <div className="clients-sector-header">
                <span className="clients-sector-icon">{sector.icon}</span>
                <span className="clients-sector-name">{sector.sector}</span>
              </div>
              <div className="clients-list">
                {sector.names.map(name => (
                  <span key={name} className="client-chip">{name}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── O aplikacji ───────────────────────────────────────────────── */}
        <div className="about-app-note">
          <span className="about-app-label">O aplikacji</span>
          <p>
            <strong>Wodzirej — Grupy &amp; Koło Fortuny</strong> to narzędzie stworzone
            do wspierania dynamiki grupowej podczas warsztatów i szkoleń. Umożliwia losowy
            podział na grupy, losowanie uczestników oraz import listy z Excel, CSV lub
            zdjęcia kartki.
          </p>
        </div>

        <div className="about-footer">
          Created &amp; designed by <strong>Sebastian Szajner</strong> · 2025
        </div>

      </div>
    </div>
  );
}
