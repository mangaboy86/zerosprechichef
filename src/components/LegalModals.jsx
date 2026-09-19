import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const PRIVACY_CONTENT = [
  {
    h: "1. Titolarità e finalità",
    p: "Zero Sprechi Chef è un'applicazione pensata per aiutarti a ridurre lo spreco alimentare. Rispettiamo la tua privacy in conformità al Regolamento Generale sulla Protezione dei Dati (GDPR - UE 2016/679) e al California Consumer Privacy Act (CCPA).",
  },
  {
    h: "2. Nessuna raccolta di dati personali sensibili",
    p: "L'app NON raccoglie dati personali sensibili senza il tuo esplicito consenso. Non richiediamo registrazione, non raccogliamo nome, email, numeri di telefono o dati di geolocalizzazione per il funzionamento delle ricette.",
  },
  {
    h: "3. Memorizzazione locale delle preferenze",
    p: "Le tue ricette preferite e le tue preferenze (come la dispensa base o il consenso ai cookie) vengono salvate esclusivamente in locale sul tuo dispositivo tramite il LocalStorage del browser. Questi dati non lasciano mai il tuo dispositivo e non vengono trasmessi ai nostri server.",
  },
  {
    h: "4. Ingredienti inviati per la generazione",
    p: "Gli ingredienti che inserisci vengono inviati in modo anonimo a un servizio di intelligenza artificiale al solo scopo di generare la ricetta. Non sono associati alla tua identità.",
  },
  {
    h: "5. Cookie",
    p: "Utilizziamo esclusivamente cookie/archiviazione tecnici necessari al funzionamento dell'app. Non utilizziamo cookie di profilazione a fini pubblicitari.",
  },
  {
    h: "6. I tuoi diritti",
    p: "Poiché i dati risiedono solo sul tuo dispositivo, puoi eliminarli in qualsiasi momento cancellando i preferiti o svuotando i dati del browser/app.",
  },
];

export const TERMS_CONTENT = [
  {
    h: "1. Natura del servizio",
    p: "Le ricette fornite da Zero Sprechi Chef sono suggerimenti generati da un'intelligenza artificiale, pensati esclusivamente per uso domestico e a scopo ispirativo. Non costituiscono consulenza professionale, nutrizionale o medica.",
  },
  {
    h: "2. Responsabilità dell'utente",
    p: "L'utente è l'unico responsabile dell'ispezione della freschezza degli alimenti, della corretta conservazione igienica e della manipolazione sicura degli ingredienti prima e durante la preparazione. Verifica sempre che gli alimenti da smaltire siano ancora idonei al consumo.",
  },
  {
    h: "3. Disclaimer allergeni",
    p: "I consigli sulla gestione di allergeni e ingredienti sono indicativi. Verificare sempre le etichette dei prodotti prima del consumo. In caso di allergie o intolleranze accertate, consulta un professionista.",
  },
  {
    h: "4. Cottura e sicurezza alimentare",
    p: "Assicurati sempre che gli alimenti raggiungano le temperature di cottura sicure raccomandate, in particolare carne, pesce, uova e pollame. Le indicazioni tecniche fornite non sostituiscono le buone pratiche di sicurezza alimentare.",
  },
  {
    h: "5. Limitazione di responsabilità",
    p: "Zero Sprechi Chef e i suoi sviluppatori non si assumono alcuna responsabilità per eventuali danni, malori o conseguenze derivanti dalla preparazione o dal consumo dei piatti suggeriti dall'applicazione.",
  },
];

export const LegalModal = ({ open, onClose, title, content }) => {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        data-testid="legal-modal"
        className="max-w-2xl max-h-[85vh] overflow-y-auto bg-cream border-[#E2DACF] rounded-2xl"
      >
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-ink text-left">
            {title}
          </DialogTitle>
          <DialogDescription className="sr-only">Informativa legale {title}</DialogDescription>
        </DialogHeader>
        <div className="space-y-5 mt-2">
          {content.map((s) => (
            <div key={s.h}>
              <h4 className="font-semibold text-ink text-sm mb-1">{s.h}</h4>
              <p className="text-sm text-ink-muted leading-relaxed">{s.p}</p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
