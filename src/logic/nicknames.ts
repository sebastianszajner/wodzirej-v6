// Mapa zdrobnień → forma kanoniczna (do wykrywania kolizji imion w grupach)
const CANON: Record<string, string> = {
  anna:'anna', ania:'anna', anka:'anna', hania:'anna', hanka:'anna', aneczka:'anna',
  aleksandra:'aleksandra', ola:'aleksandra', aleks:'aleksandra',
  katarzyna:'katarzyna', kasia:'katarzyna', kaśka:'katarzyna', kachna:'katarzyna',
  małgorzata:'małgorzata', gosia:'małgorzata', gosik:'małgorzata', małgosia:'małgorzata',
  agnieszka:'agnieszka', aga:'agnieszka',
  agata:'agata',
  joanna:'joanna', joasia:'joanna', asia:'joanna',
  krzysztof:'krzysztof', krzysiek:'krzysztof', krzysio:'krzysztof',
  tomasz:'tomasz', tomek:'tomasz', tomcio:'tomasz',
  piotr:'piotr', piotrek:'piotr', piotruś:'piotr',
  michał:'michał', michałek:'michał', misiek:'michał', misio:'michał',
  marek:'marek', maruś:'marek',
  paweł:'paweł', pawełek:'paweł',
  janusz:'janusz', janek:'janusz', jan:'janusz',
  andrzej:'andrzej', andrzejek:'andrzej',
  magdalena:'magdalena', magda:'magdalena', madzia:'magdalena',
  marta:'marta',
  martyna:'martyna',
  monika:'monika', monisia:'monika',
  ewa:'ewa', ewka:'ewa',
  ewelina:'ewelina',
  dorota:'dorota', dorotka:'dorota', dora:'dorota',
  barbara:'barbara', basia:'barbara', baśka:'barbara',
  beata:'beata', beatka:'beata',
  marcin:'marcin',
  kamil:'kamil',
  kamila:'kamila',
  karol:'karol', karolek:'karol',
  karolina:'karolina', karo:'karolina',
  łukasz:'łukasz', łukaszek:'łukasz',
  wojciech:'wojciech', wojtek:'wojciech', wojtuś:'wojciech',
  szymon:'szymon', szymek:'szymon',
  jakub:'jakub', kuba:'jakub', kubus:'jakub',
  adam:'adam', adamek:'adam',
  robert:'robert', robek:'robert',
  natalia:'natalia', natalka:'natalia', natka:'natalia',
  julia:'julia', julka:'julia',
  wiktoria:'wiktoria', wika:'wiktoria', wikcia:'wiktoria',
  zuzanna:'zuzanna', zuza:'zuzanna', zuzka:'zuzanna',
  maja:'maja', majka:'maja',
  nina:'nina', ninka:'nina',
  patrycja:'patrycja', patka:'patrycja',
  patryk:'patryk', patryś:'patryk',
};

function normalize(name: string): string {
  return name.trim().toLowerCase()
    .replace(/ą/g,'a').replace(/ć/g,'c').replace(/ę/g,'e')
    .replace(/ł/g,'l').replace(/ń/g,'n').replace(/ó/g,'o')
    .replace(/ś/g,'s').replace(/ź/g,'z').replace(/ż/g,'z');
}

export function canonicalFirst(name: string): string {
  const n = normalize(name);
  return CANON[n] ?? n;
}

/** Czy w grupie jest co najmniej 2 osoby z tym samym kanonicznym imieniem? */
export function needsLastName(firstName: string, groupFirstNames: string[]): boolean {
  const canon = canonicalFirst(firstName);
  let count = 0;
  for (const fn of groupFirstNames) {
    if (canonicalFirst(fn) === canon) count++;
    if (count >= 2) return true;
  }
  return false;
}
