import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

function beep() {
  try {
    const ctx = new AudioContext();
    [0, 0.3, 0.6].forEach((t) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.25, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.25);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.25);
    });
  } catch {
    // No audio available: the ringing animation still shows.
  }
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export function Timer({ minutes }: { minutes: number }) {
  const total = Math.round(minutes * 60);
  const [left, setLeft] = useState(total);
  const [running, setRunning] = useState(false);
  const endAt = useRef(0);

  useEffect(() => {
    if (!running) return;
    endAt.current = Date.now() + left * 1000;
    const id = setInterval(() => {
      const next = Math.max(0, Math.round((endAt.current - Date.now()) / 1000));
      setLeft(next);
      if (next === 0) {
        setRunning(false);
        beep();
        navigator.vibrate?.([300, 150, 300]);
      }
    }, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const done = left === 0;
  const r = 18;
  const c = 2 * Math.PI * r;
  return (
    <button
      className={`timer${done ? " ring" : ""}`}
      onClick={() => (done ? (setLeft(total), setRunning(false)) : setRunning(!running))}
      aria-label={done ? "Timer done. Reset" : running ? "Pause timer" : `Start ${minutes} minute timer`}
    >
      <svg width="44" height="44" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r={r} fill="none" stroke="var(--line)" strokeWidth="5" />
        <motion.circle
          cx="22" cy="22" r={r} fill="none" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round"
          strokeDasharray={c} transform="rotate(-90 22 22)"
          animate={{ strokeDashoffset: c * (1 - left / total) }}
          transition={{ duration: 0.3 }}
        />
      </svg>
      <span>{done ? "Time's up! ⏰" : running ? fmt(left) : left === total ? `Start ${minutes} min timer` : `${fmt(left)} · paused`}</span>
    </button>
  );
}
