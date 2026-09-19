import { useEffect, useState } from 'react';

export function RestChip() {
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(90);
  const [left, setLeft] = useState(90);

  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => {
      setLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(t);
  }, [running]);

  useEffect(() => {
    if (left === 0 && running) setRunning(false);
  }, [left, running]);

  const m = Math.floor(left / 60);
  const s = String(left % 60).padStart(2, '0');

  return (
    <div className="rest-chip" aria-label="Optional rest timer">
      <button
        type="button"
        className="ghost"
        onClick={() => {
          setLeft(seconds);
          setRunning((v) => !v);
        }}
      >
        {running ? `${m}:${s}` : 'Rest'}
      </button>
      <button type="button" className="ghost" onClick={() => setSeconds((n) => Math.max(30, n - 15))}>
        −
      </button>
      <span>{seconds}s</span>
      <button type="button" className="ghost" onClick={() => setSeconds((n) => n + 15)}>
        +
      </button>
    </div>
  );
}
