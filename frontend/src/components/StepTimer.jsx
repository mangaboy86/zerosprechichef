import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Timer, Play, Pause, RotateCcw } from "lucide-react";

// Extract the most relevant minute duration mentioned in a step's text.
export function extractMinutes(text) {
  if (!text) return null;
  const t = text.toLowerCase();
  // ranges like "3-4 minuti" -> take the higher bound
  const range = t.match(/(\d+)\s*[-–]\s*(\d+)\s*minut/);
  if (range) return parseInt(range[2], 10);
  const single = t.match(/(\d+)\s*minut/);
  if (single) return parseInt(single[1], 10);
  if (/mezz'?ora|mezzora/.test(t)) return 30;
  const hour = t.match(/(\d+)\s*or[ae]/);
  if (hour) return parseInt(hour[1], 10) * 60;
  if (/\bun minuto\b/.test(t)) return 1;
  return null;
}

export const StepTimer = ({ minutes, label }) => {
  const total = minutes * 60;
  const [remaining, setRemaining] = useState(total);
  const [running, setRunning] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) {
            clearInterval(ref.current);
            setRunning(false);
            toast.success(`Timer terminato: ${label || minutes + " min"}!`);
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    }
    return () => clearInterval(ref.current);
  }, [running, label, minutes]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const done = remaining === 0;

  const toggle = () => {
    if (done) {
      setRemaining(total);
      setRunning(true);
      return;
    }
    setRunning((r) => !r);
  };

  const reset = () => {
    setRunning(false);
    setRemaining(total);
  };

  return (
    <div
      data-testid="step-timer"
      className={`inline-flex items-center gap-2 mt-2 pl-2.5 pr-1.5 py-1 rounded-full border transition-colors duration-300 ${
        running
          ? "bg-sage text-cream border-sage"
          : done
          ? "bg-terracotta text-cream border-terracotta"
          : "bg-sage-light text-sage border-transparent hover:border-sage"
      }`}
    >
      <Timer size={14} />
      <span className="font-mono text-sm tabular-nums">
        {mm}:{ss}
      </span>
      <button
        onClick={toggle}
        data-testid="step-timer-toggle"
        aria-label={running ? "Pausa timer" : "Avvia timer"}
        className="grid place-items-center w-6 h-6 rounded-full bg-white/25 hover:bg-white/40 transition-colors duration-300"
      >
        {running ? <Pause size={12} /> : <Play size={12} />}
      </button>
      {(running || remaining !== total) && (
        <button
          onClick={reset}
          aria-label="Reimposta timer"
          className="grid place-items-center w-6 h-6 rounded-full bg-white/25 hover:bg-white/40 transition-colors duration-300"
        >
          <RotateCcw size={12} />
        </button>
      )}
    </div>
  );
};
