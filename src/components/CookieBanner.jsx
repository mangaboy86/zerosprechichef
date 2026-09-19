import React, { useState, useEffect } from "react";
import { getCookieConsent, setCookieConsent } from "@/lib/storage";
import { Cookie } from "lucide-react";

export const CookieBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!getCookieConsent()) {
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  const handle = (value) => {
    setCookieConsent(value);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      data-testid="cookie-banner"
      className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:max-w-md z-50 animate-fade-up"
    >
      <div className="bg-ink text-cream rounded-2xl shadow-[0_12px_40px_-8px_rgba(44,53,49,0.5)] p-5 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-terracotta shrink-0">
            <Cookie size={18} />
          </span>
          <p className="text-sm leading-relaxed text-cream/90">
            Usiamo solo archiviazione tecnica locale per salvare le tue preferenze
            e i tuoi preferiti direttamente sul dispositivo. Nessun dato personale
            lascia il tuo telefono.
          </p>
        </div>
        <div className="flex items-center gap-2 justify-end">
          <button
            data-testid="cookie-reject-button"
            onClick={() => handle("essential")}
            className="px-4 py-2 rounded-full text-xs font-medium text-cream/80 hover:text-cream transition-colors duration-300"
          >
            Solo essenziali
          </button>
          <button
            data-testid="cookie-accept-button"
            onClick={() => handle("accepted")}
            className="px-5 py-2 rounded-full text-sm font-semibold bg-sage hover:bg-sage-hover transition-colors duration-300"
          >
            Accetto
          </button>
        </div>
      </div>
    </div>
  );
};
