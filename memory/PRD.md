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
- ✅ Legal footer + Privacy/Terms modals (GDPR/CCPA + culinary/health disclaimer) + cookie banner.
- ✅ PWA: manifest, service worker, generated icons, Italian meta.
- ✅ Warm editorial design (Playfair Display + Plus Jakarta Sans, sage/terracotta/cream).
- ✅ Backend + frontend tested 100% pass (iteration_1).

## Backlog
- P1: Condivisione/esport ricetta (PDF o link).
- P2: Ricerca/filtri nei Preferiti.
- P2: Lista della spesa per gli ingredienti mancanti.
