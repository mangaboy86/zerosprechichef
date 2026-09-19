import React, { useState } from "react";
import { LegalModal, PRIVACY_CONTENT, TERMS_CONTENT } from "@/components/LegalModals";

export const Footer = () => {
  const [open, setOpen] = useState(null);

  return (
    <>
      <footer
        data-testid="legal-footer"
        className="mt-auto border-t border-[#E2DACF] bg-card-alt/60"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-ink-muted text-center sm:text-left">
            © {new Date().getFullYear()} Zero Sprechi Chef — Cucina anti-spreco d'autore.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs">
            <button
              data-testid="privacy-modal-trigger"
              onClick={() => setOpen("privacy")}
              className="text-ink-muted hover:text-sage transition-colors duration-300 underline underline-offset-2"
            >
              Privacy Policy & Cookie
            </button>
            <button
              data-testid="terms-modal-trigger"
              onClick={() => setOpen("terms")}
              className="text-ink-muted hover:text-sage transition-colors duration-300 underline underline-offset-2"
            >
              Termini di Servizio & Disclaimer
            </button>
          </div>
        </div>
      </footer>

      <LegalModal
        open={open === "privacy"}
        onClose={() => setOpen(null)}
        title="Privacy Policy & Cookie"
        content={PRIVACY_CONTENT}
      />
      <LegalModal
        open={open === "terms"}
        onClose={() => setOpen(null)}
        title="Termini di Servizio & Disclaimer Culinario/Sanitario"
        content={TERMS_CONTENT}
      />
    </>
  );
};
