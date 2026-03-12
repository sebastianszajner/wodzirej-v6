import { QRCodeSVG } from 'qrcode.react';
import { getRoomURL } from '../../lib/room';

interface Props {
  roomId: string;
  wordCount: number;
  onClose: () => void;
}

export function LiveOverlay({ roomId, wordCount, onClose }: Props) {
  const url = getRoomURL(roomId);

  return (
    <div className="live-overlay">
      <style>{LIVE_STYLES}</style>

      <div className="live-header">
        <div className="live-badge">
          <span className="live-dot" />
          LIVE
        </div>
        <span className="live-room-label">Pokój: <strong>{roomId}</strong></span>
        <button className="live-close-btn" onClick={onClose} title="Zakończ sesję">
          ✕ Zakończ
        </button>
      </div>

      <div className="live-body">
        <div className="live-qr-card">
          <div className="live-qr-wrapper">
            <QRCodeSVG
              value={url}
              size={220}
              bgColor="#ffffff"
              fgColor="#0f0f13"
              level="M"
              includeMargin
            />
          </div>
          <div className="live-qr-text">
            <p className="live-qr-instruction">Zeskanuj kod QR telefonem</p>
            <p className="live-qr-or">lub wejdź na:</p>
            <p className="live-qr-url">{url}</p>
          </div>
        </div>

        <div className="live-stats">
          <div className="live-stat">
            <span className="live-stat-value">{wordCount}</span>
            <span className="live-stat-label">{wordCount === 1 ? 'słowo' : wordCount < 5 ? 'słowa' : 'słów'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const LIVE_STYLES = `
.live-overlay {
  background: rgba(15, 15, 19, 0.95);
  border-radius: 14px;
  padding: 20px;
  margin-bottom: 16px;
  border: 1px solid rgba(233, 30, 99, 0.3);
}
.live-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.live-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  background: rgba(244, 67, 54, 0.15);
  color: #f44336;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
}
.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f44336;
  animation: live-pulse 1.5s ease-in-out infinite;
}
@keyframes live-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
.live-room-label {
  font-size: 14px;
  color: var(--txt-muted);
}
.live-close-btn {
  margin-left: auto;
  padding: 6px 14px;
  border-radius: 8px;
  background: rgba(244, 67, 54, 0.12);
  color: #f44336;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid rgba(244, 67, 54, 0.2);
  transition: all 0.15s;
}
.live-close-btn:hover {
  background: rgba(244, 67, 54, 0.25);
}
.live-body {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
  justify-content: center;
}
.live-qr-card {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  justify-content: center;
}
.live-qr-wrapper {
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
}
.live-qr-text {
  text-align: left;
}
.live-qr-instruction {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 4px;
}
.live-qr-or {
  font-size: 13px;
  color: var(--txt-muted);
  margin-bottom: 4px;
}
.live-qr-url {
  font-size: 12px;
  color: var(--accent);
  word-break: break-all;
  font-family: monospace;
  background: var(--input-bg);
  padding: 6px 10px;
  border-radius: 8px;
  max-width: 320px;
}
.live-stats {
  display: flex;
  gap: 16px;
}
.live-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 20px;
  background: var(--panel-bg);
  border-radius: 12px;
}
.live-stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--accent);
}
.live-stat-label {
  font-size: 12px;
  color: var(--txt-muted);
}
`;
