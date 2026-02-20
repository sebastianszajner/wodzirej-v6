import { useRef, useState, useCallback } from 'react';
import { useStore } from '../../store';
import { parseCSV, parseXLSX } from '../../logic/parsers';

export function ImportDropzone() {
  const [over, setOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const addParticipants = useStore((s) => s.addParticipants);
  const showToast = useStore((s) => s.showToast);

  const handleFile = useCallback(async (file: File) => {
    const name = file.name.toLowerCase();
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      const buf = await file.arrayBuffer();
      const report = parseXLSX(buf);
      if (report.added.length) addParticipants(report.added);
      else showToast('Brak danych imię/nazwisko w pliku', 'error');
      if (report.rejected.length)
        showToast(`Pominięto ${report.rejected.length} wierszy`, 'info');
    } else {
      const text = await file.text();
      const report = parseCSV(text);
      if (report.added.length) addParticipants(report.added);
      else showToast('Nie znaleziono uczestników w pliku', 'error');
      if (report.rejected.length)
        showToast(`Pominięto ${report.rejected.length} wierszy`, 'info');
    }
  }, [addParticipants, showToast]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onPaste = useCallback((e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    if (!text) return;
    const report = parseCSV(text);
    if (report.added.length) addParticipants(report.added);
    else showToast('Nie znaleziono uczestników w tekście', 'error');
  }, [addParticipants, showToast]);

  return (
    <div
      className={`dropzone ${over ? 'over' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      onPaste={onPaste}
      onClick={() => fileRef.current?.click()}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
      title="Upuść plik Excel/CSV lub kliknij"
    >
      <div className="dz-icon">📂</div>
      <div className="dz-title">Upuść Excel / CSV</div>
      <div className="dz-sub">lub kliknij aby wybrać plik • wklej CSV (Ctrl+V)</div>
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls,.csv,.txt"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}
