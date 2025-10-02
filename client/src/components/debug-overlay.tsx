import { useState, useEffect } from 'react';

interface DebugOverlayProps {
  isVisible?: boolean;
}

export default function DebugOverlay({ isVisible = false }: DebugOverlayProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [clickEvents, setClickEvents] = useState<number>(0);
  const [touchEvents, setTouchEvents] = useState<number>(0);

  useEffect(() => {
    const addLog = (message: string) => {
      setLogs(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${message}`]);
    };

    // Listen for all click events
    const handleGlobalClick = (e: MouseEvent) => {
      setClickEvents(prev => prev + 1);
      const target = e.target as Element;
      const className = typeof target?.className === 'string' ? target.className : '';
      const id = target?.id || '';
      addLog(`Click on: ${target?.tagName} ${className.slice(0, 20)} ${id}`);
    };

    // Listen for all touch events
    const handleGlobalTouch = (e: TouchEvent) => {
      setTouchEvents(prev => prev + 1);
      addLog(`Touch detected on: ${(e.target as Element)?.tagName || 'unknown'}`);
    };

    document.addEventListener('click', handleGlobalClick, true);
    document.addEventListener('touchstart', handleGlobalTouch, true);

    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
      document.removeEventListener('touchstart', handleGlobalTouch, true);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs z-[9999] max-w-xs">
      <h3 className="font-bold mb-2">Debug Info</h3>
      <div className="space-y-1">
        <div>Clicks: {clickEvents}</div>
        <div>Touches: {touchEvents}</div>
        <div>User Agent: {navigator.userAgent.substring(0, 30)}...</div>
        <div className="mt-2">
          <strong>Recent Events:</strong>
          {logs.map((log, i) => (
            <div key={i} className="text-xs opacity-75">{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
}