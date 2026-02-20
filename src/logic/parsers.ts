import * as XLSX from 'xlsx';

export interface ParsedPerson {
  first: string;
  last: string;
  text: string;
}

export interface ParseReport {
  added: ParsedPerson[];
  rejected: { line: string; reason: string }[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const BLACKLIST = new Set([
  'klient','temat','firma','sp','spółka','szkolenie','data','miejsce',
  'lista','obecność','uczestnik','grupa','client','topic','company',
  'date','place','attendance','total','razem','lp','nr','no','imię','imie',
  'nazwisko','firstname','lastname','name','surname',
]);

function safeTrim(s: unknown): string {
  return String(s ?? '').replace(/\s+/g, ' ').trim();
}

function onlyLetters(s: string): string {
  return safeTrim(s).replace(/[^a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\-' ]/g, '');
}

function titleCase(s: string): string {
  if (!s) return '';
  return s.split(' ').map((w) => w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : '').join(' ');
}

function normalizeKey(s: string): string {
  return safeTrim(s).toLowerCase()
    .replace(/['".,;:]/g, '')
    .replace(/ą/g,'a').replace(/ć/g,'c').replace(/ę/g,'e')
    .replace(/ł/g,'l').replace(/ń/g,'n').replace(/ó/g,'o')
    .replace(/ś/g,'s').replace(/ź/g,'z').replace(/ż/g,'z');
}

function isValidName(s: string): boolean {
  if (!s || s.length < 2 || s.length > 40) return false;
  if (/\d/.test(s)) return false;
  if (BLACKLIST.has(normalizeKey(s))) return false;
  return true;
}

function isFuzzyFirst(s: string): boolean {
  const n = normalizeKey(s);
  return ['imie','imię','firstname','first name','first','imiona','name'].includes(n);
}

function isFuzzyLast(s: string): boolean {
  const n = normalizeKey(s);
  return ['nazwisko','lastname','last name','surname','last','family name'].includes(n);
}

function buildPerson(f: string, l: string): ParsedPerson | null {
  const first = titleCase(onlyLetters(f));
  const last  = titleCase(onlyLetters(l));
  if (!first && !last) return null;
  if (first && !isValidName(first)) return null;
  if (last  && !isValidName(last))  return null;
  if (!first) return null; // imię jest wymagane
  const text = last ? `${first} ${last}` : first;
  return { first, last, text };
}

// ── CSV / plain text parser ───────────────────────────────────────────────────

export function parseCSV(raw: string): ParseReport {
  const report: ParseReport = { added: [], rejected: [] };
  const lines = raw.split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return report;

  // Detect separator and header row
  let sep: string | null = null;
  let colFirst = -1;
  let colLast  = -1;
  let headerIdx = -1;

  for (let i = 0; i < Math.min(lines.length, 8); i++) {
    const line = lines[i];
    for (const c of [';', ',', '\t']) {
      if (!line.includes(c)) continue;
      const parts = line.split(c).map(safeTrim);
      const iF = parts.findIndex(isFuzzyFirst);
      const iL = parts.findIndex(isFuzzyLast);
      if (iF > -1 && iL > -1) {
        sep = c; colFirst = iF; colLast = iL; headerIdx = i;
        break;
      }
    }
    if (sep) break;
  }

  // If no header found with two named columns, try to auto-detect
  if (!sep) {
    // Try first multi-column separator
    for (const c of [';', ',', '\t']) {
      if (lines[0].includes(c)) { sep = c; break; }
    }
    if (sep) { colFirst = 0; colLast = 1; }
  }

  for (let i = 0; i < lines.length; i++) {
    if (i === headerIdx) continue;
    const line = lines[i];
    if (!line) continue;

    let f = '', l = '';

    if (sep && colFirst > -1 && colLast > -1) {
      const parts = line.split(sep).map(safeTrim);
      f = parts[colFirst] || '';
      l = parts[colLast]  || '';
    } else {
      // Plain text: "Imię Nazwisko" or "1. Imię Nazwisko"
      const cleaned = line.replace(/^\d+[.)]\s*/, '');
      const tokens = cleaned.split(/\s+/);
      if (tokens.length >= 2) { f = tokens[0]; l = tokens.slice(1).join(' '); }
      else if (tokens.length === 1) { f = tokens[0]; }
    }

    const person = buildPerson(f, l);
    if (person) {
      report.added.push(person);
    } else {
      if (f || l) report.rejected.push({ line, reason: 'Niepoprawne dane' });
    }
  }

  return report;
}

// ── XLSX parser ───────────────────────────────────────────────────────────────

export function parseXLSX(data: ArrayBuffer): ParseReport {
  const report: ParseReport = { added: [], rejected: [] };

  const wb = XLSX.read(data, { type: 'array' });
  let bestSheet: unknown[][] | null = null;
  let bestHeaderRow = -1;
  let bestColFirst  = -1;
  let bestColLast   = -1;
  let bestScore     = -1;

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    for (let r = 0; r < Math.min(rows.length, 10); r++) {
      const row = rows[r].map((c) => safeTrim(c));
      const iF = row.findIndex(isFuzzyFirst);
      const iL = row.findIndex(isFuzzyLast);
      if (iF > -1 && iL > -1) {
        // Score: count valid data rows below header
        let score = 0;
        for (let k = r + 1; k < Math.min(r + 30, rows.length); k++) {
          const p = buildPerson(safeTrim(rows[k][iF]), safeTrim(rows[k][iL]));
          if (p) score++;
        }
        if (score > bestScore) {
          bestScore = score; bestSheet = rows;
          bestHeaderRow = r; bestColFirst = iF; bestColLast = iL;
        }
      }
    }

    // Fallback: no header found → try col 0 + 1
    if (bestSheet === null) {
      let score = 0;
      for (let k = 0; k < Math.min(rows.length, 30); k++) {
        const p = buildPerson(safeTrim(rows[k][0]), safeTrim(rows[k][1]));
        if (p) score++;
      }
      if (score > bestScore) {
        bestScore = score; bestSheet = rows;
        bestHeaderRow = -1; bestColFirst = 0; bestColLast = 1;
      }
    }
  }

  if (!bestSheet) return report;

  for (let i = bestHeaderRow + 1; i < bestSheet.length; i++) {
    const row = bestSheet[i];
    const f = safeTrim(row[bestColFirst]);
    const l = safeTrim(row[bestColLast]);
    const line = row.join('|');
    const person = buildPerson(f, l);
    if (person) {
      report.added.push(person);
    } else if (row.some((c) => safeTrim(c).length > 0)) {
      report.rejected.push({ line, reason: 'Pominięto wiersz' });
    }
  }

  return report;
}
