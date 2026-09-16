import React, { useState, useEffect, useRef } from "react";
import { StepTimer, extractMinutes } from "@/components/StepTimer";
import { X, ChevronLeft, ChevronRight, UtensilsCrossed, CheckCircle2, ChefHat } from "lucide-react";

export const CookMode = ({ recipe, open, onClose }) => {
  const steps = recipe?.brigade_steps || [];
  const total = steps.length;
  const [idx, setIdx] = useState(0);
  const wakeLockRef = useRef(null);

  useEffect(() => {
    if (open) setIdx(0);
  }, [open, recipe?.id]);

  useEffect(() => {
    let released = false;
    async function acquire() {
      try {
        if (open && "wakeLock" in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request("screen");
        }
      } catch {
        /* wake lock not critical */
      }
    }
    if (open) acquire();
    return () => {
      released = true;
      if (wakeLockRef.current) {
        wakeLockRef.current.release?.().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e) => {
      if (!open) return;
      if (e.key === "ArrowRight") setIdx((i) => Math.min(i + 1, total - 1));
      if (e.key === "ArrowLeft") setIdx((i) => Math.max(i - 1, 0));
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, total, onClose]);

  if (!open || !recipe) return null;

  const step = steps[idx];
  const mins = extractMinutes(step);
  const isLast = idx === total - 1;

  return (
    <div
      data-testid="cook-mode"
      className="fixed inset-0 z-[60] bg-ink text-cream flex flex-col animate-fade-up"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 sm:px-8 py-4 border-b border-white/10">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-sage shrink-0">
            <ChefHat size={18} />
          </span>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-widest text-terracotta">Modalità Cucina</p>
            <h2 className="font-serif text-lg sm:text-xl truncate">{recipe.title}</h2>
          </div>
        </div>
        <button
          data-testid="cook-mode-close"
          onClick={onClose}
          className="grid place-items-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-300 shrink-0"
          aria-label="Chiudi modalità cucina"
        >
          <X size={20} />
        </button>
      </div>

      {/* Progress */}
      <div className="px-5 sm:px-8 pt-5">
        <div className="flex items-center justify-between text-sm text-cream/70 mb-2">
          <span>Passo {idx + 1} di {total}</span>
          <span className="font-mono">{Math.round(((idx + 1) / total) * 100)}%</span>
        </div>
        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-sage rounded-full transition-[width] duration-300"
            style={{ width: `${((idx + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Step body */}
      <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-8 flex flex-col items-center justify-center text-center">
        <div className="max-w-2xl w-full">
          <span className="grid place-items-center w-16 h-16 mx-auto rounded-2xl bg-white/10 font-serif text-3xl font-bold text-sage mb-8">
            {idx + 1}
          </span>
          <p
            data-testid="cook-mode-step-text"
            className="font-serif text-2xl sm:text-3xl lg:text-4xl leading-snug text-cream"
          >
            {step}
          </p>
          {mins ? (
            <div className="mt-8 flex justify-center scale-125">
              <StepTimer minutes={mins} label={`Passo ${idx + 1}`} />
            </div>
          ) : null}
        </div>
      </div>

      {/* Mise en place quick ref */}
      <details className="px-5 sm:px-8 border-t border-white/10">
        <summary className="flex items-center gap-2 py-3 cursor-pointer text-sm text-cream/80 hover:text-cream transition-colors duration-300 list-none">
          <UtensilsCrossed size={15} className="text-terracotta" /> Ingredienti a portata di mano
        </summary>
        <ul className="pb-4 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5 text-sm text-cream/80">
          {recipe.mise_en_place?.map((m, i) => (
            <li key={i} className="flex justify-between gap-3 border-b border-white/5 py-1">
              <span>{m.ingredient}</span>
              <span className="font-mono text-sage">{m.quantity}</span>
            </li>
          ))}
        </ul>
      </details>

      {/* Nav */}
      <div className="flex items-center gap-3 px-5 sm:px-8 py-5 border-t border-white/10">
        <button
          data-testid="cook-mode-prev"
          onClick={() => setIdx((i) => Math.max(i - 1, 0))}
          disabled={idx === 0}
          className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-full font-semibold bg-white/10 hover:bg-white/20 transition-colors duration-300 disabled:opacity-30"
        >
          <ChevronLeft size={20} /> <span className="hidden sm:inline">Precedente</span>
        </button>
        {isLast ? (
          <button
            data-testid="cook-mode-finish"
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-full font-semibold bg-terracotta hover:bg-terracotta-hover transition-colors duration-300"
          >
            <CheckCircle2 size={20} /> Piatto pronto!
          </button>
        ) : (
          <button
            data-testid="cook-mode-next"
            onClick={() => setIdx((i) => Math.min(i + 1, total - 1))}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-full font-semibold bg-sage hover:bg-sage-hover transition-colors duration-300"
          >
            <span>Successivo</span> <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
};
