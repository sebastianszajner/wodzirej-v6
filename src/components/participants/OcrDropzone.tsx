/**
 * OcrDropzone – wrzuć zdjęcie kartki / screenshot z imionami i nazwiskami.
 * Używa Tesseract.js (pol+eng) do OCR, potem tego samego parsera co CSV.
 */
import { useRef, useState, useCallback } from 'react';
import { createWorker } from 'tesseract.js';
import { useStore } from '../../store';
import { parseCSV } from '../../logic/parsers';

type Status = 'idle' | 'loading' | 'done' | 'error';

export function OcrDropzone() {
  const [over, setOver]       = useState(false);
  const [status, setStatus]   = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const addParticipants = useStore((s) => s.addParticipants);
  const showToast       = useStore((s) => s.showToast);

  const processImage = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Wybierz plik graficzny (JPG, PNG, WEBP…)', 'error');
      return;
    }

    // Podgląd
    const url = URL.createObjectURL(file);
    setPreview(url);
    setStatus('loading');
    setProgress(0);

    try {
      const worker = await createWorker(['pol', 'eng'], 1, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      // Użyj parsera CSV – rozumie wiersze "Imię Nazwisko"
      const report = parseCSV(text);

      if (report.added.length) {
        addParticipants(report.added);
        showToast(`OCR: dodano ${report.added.length} osób`, 'success');
        setStatus('done');
      } else {
        showToast('Nie rozpoznano imion i nazwisk na zdjęciu', 'error');
        setStatus('error');
      }
    } catch (err) {
      console.error('OCR error', err);
      showToast('Błąd OCR — spróbuj wyraźniejsze zdjęcie', 'error');
      setStatus('error');
    }
  }, [addParticipants, showToast]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processImage(file);
  }, [processImage]);

  const reset = () => {
    setStatus('idle');
    setPreview(null);
    setProgress(0);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div
      className={`dropzone ocr-dropzone ${over ? 'over' : ''} ${status}`}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      onClick={() => status === 'idle' || status === 'error' ? fileRef.current?.click() : undefined}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
      title="Wrzuć zdjęcie kartki z listą uczestników"
    >
      {status === 'idle' && (
        <>
          <div className="dz-icon">📷</div>
          <div className="dz-title">Wrzuć zdjęcie / screenshot</div>
          <div className="dz-sub">System odczyta imiona i nazwiska z kartki lub screenshota</div>
        </>
      )}

      {status === 'loading' && (
        <>
          <div className="dz-icon" style={{ animation: 'pulse 1s infinite' }}>🔍</div>
          <div className="dz-title">Rozpoznawanie tekstu… {progress}%</div>
          <div className="ocr-bar">
            <div className="ocr-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          {preview && (
            <img src={preview} alt="podgląd" className="ocr-preview" />
          )}
        </>
      )}

      {status === 'done' && (
        <>
          <div className="dz-icon">✅</div>
          <div className="dz-title">Gotowe! Uczestnicy dodani.</div>
          <button className="btn sm" style={{ marginTop: 8 }} onClick={(e) => { e.stopPropagation(); reset(); }}>
            Wrzuć kolejne zdjęcie
          </button>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="dz-icon">⚠️</div>
          <div className="dz-title">Nie udało się odczytać. Spróbuj ponownie.</div>
          <button className="btn sm danger" style={{ marginTop: 8 }} onClick={(e) => { e.stopPropagation(); reset(); }}>
            Spróbuj ponownie
          </button>
        </>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) processImage(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}
