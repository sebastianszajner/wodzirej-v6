import { useState, useEffect } from 'react';

export function FullscreenButton({ targetRef }: { targetRef: React.RefObject<HTMLElement | null> }) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggle = () => {
    if (!targetRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      targetRef.current.requestFullscreen();
    }
  };

  return (
    <button className="btn sm" onClick={toggle} title={isFullscreen ? 'Wyjdź z fullscreen' : 'Pełny ekran'}>
      {isFullscreen ? '⊠' : '⛶'}
    </button>
  );
}
