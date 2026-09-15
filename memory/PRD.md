# PRD — Zero Sprechi Chef

## Problem Statement
Web app "Zero Sprechi Chef" (italiano) che riduce lo spreco alimentare guidando l'utente come un Executive Chef. Genera ricette equilibrate dagli avanzi, spiega perché esclude certi ingredienti, focus su tecniche di cottura. PWA installabile, conformità legale (GDPR/CCPA, disclaimer culinario/sanitario).

## Architecture
- Frontend: React (CRA/craco), Tailwind, shadcn/ui, react-router, framer-motion, lucide-react, sonner.
- Backend: FastAPI, endpoint `/api/generate-recipe`, MongoDB (recipes log).
- AI: Gemini 3 Flash (`gemini-3-flash-preview`) via emergentintegrations + EMERGENT_LLM_KEY.
- Preferiti: solo LocalStorage (nessun account). Cookie consent in LocalStorage.
- PWA: manifest.json + service worker (sw.js) + icone.

## User Persona
Persona domestica attenta agli sprechi che vuole idee di cucina d'autore dagli avanzi.

## Core Requirements (static)
- Home con input ingredienti, dispensa "I Mai Senza", porzioni, filtri (tempo/attrezzatura/dieta), CTA.
- System prompt con regole: selezione ingredienti, sezione "I rimasti in dispensa", focus tecnico, disclaimer allergeni obbligatorio.
- Scheda ricetta: Perché funziona, Mise en Place & Dosaggio, Preparazione da Brigata, Il Tocco da Chef, rimasti in dispensa.
- Preferiti offline (salva/riapri/elimina).
- Footer legale con Privacy & Cookie e Termini & Disclaimer; banner cookie.

## Implemented (2026-06)
- ✅ Full Home form + AI recipe generation (Gemini 3 Flash), regenerate.
- ✅ Executive-chef system prompt with all mandatory rules; verified exclusion logic + disclaimer.
- ✅ RecipeCard with all sections + allergen disclaimer.
- ✅ Favorites (LocalStorage) list + detail modal + delete + empty state.
- ✅ Legal footer + Privacy/Terms modals + cookie banner.
- ✅ PWA: manifest, service worker, generated icons, Italian meta.
- ✅ Lista Spesa (AI missing-ingredients), Condividi/Esporta PDF, Cerca+filtro dieta nei Preferiti, Recupero Bucce.
- ✅ Scala Porzioni: ricalcolo dosi deterministico lato server (no LLM, gestisce g/ml/frazioni/"q.b.").
- ✅ Foto Piatto: immagine d'autore generata (Gemini nano banana) + object storage, mostrata in cima alla scheda; thumbnail nei preferiti.
- ✅ Timer Cottura: chip timer tappabili accanto ai passaggi con tempo (StepTimer.extractMinutes).
- ✅ Preferiti per Categoria: raggruppamento per tipo di piatto (category dall'AI).
- ✅ Backend pytest 100% (iterazioni 1-3).

## Note
- La generazione ricette e foto consuma budget dell'Emergent Universal Key; in caso di 502 sugli endpoint LLM, ricaricare il budget (Profile → Manage plan → Universal Key → Add Balance). Lo scaling porzioni NON usa LLM.

## Backlog
- P2: Ricerca/filtri avanzati, condivisione via link pubblico, lista spesa esportabile.
