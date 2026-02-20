import { useStore } from '../../store';
import { ImportDropzone } from './ImportDropzone';

export function ParticipantsPanel() {
  const participants = useStore((s) => s.participants);
  const remove = useStore((s) => s.removeParticipant);
  const clear = useStore((s) => s.clearParticipants);

  return (
    <div className="panel">
      <div className="panel-body">
        <ImportDropzone />

        <div className="plist-header">
          <h3>Uczestnicy ({participants.length}/30)</h3>
          {participants.length > 0 && (
            <button className="btn sm danger" onClick={clear}>Wyczyść</button>
          )}
        </div>

        {participants.length === 0 ? (
          <p style={{ color: 'var(--txt-muted)', fontSize: 12, textAlign: 'center', paddingTop: 20 }}>
            Brak uczestników — wgraj plik lub wklej CSV
          </p>
        ) : (
          <div>
            {participants.map((p, idx) => (
              <div className="participant-row" key={p.id}>
                <span className="num">{idx + 1}.</span>
                <span className="name">
                  {p.first}
                  {p.last && <span className="last-name">{p.last}</span>}
                </span>
                <button
                  className="del-btn"
                  onClick={() => remove(p.id)}
                  title="Usuń"
                >×</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
