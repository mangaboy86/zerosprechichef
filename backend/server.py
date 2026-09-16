from fastapi import FastAPI, APIRouter, HTTPException, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
import base64
import re
import logging
import uuid
import asyncio
import requests
from fractions import Fraction
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone

from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ['EMERGENT_LLM_KEY']

# ---------- Object storage ----------
STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
APP_NAME = "zero-sprechi-chef"
storage_key = None


def init_storage(force: bool = False):
    global storage_key
    if storage_key and not force:
        return storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_LLM_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key


def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120,
    )
    if resp.status_code == 404:
        key = init_storage(force=True)
        resp = requests.put(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key, "Content-Type": content_type},
            data=data, timeout=120,
        )
    resp.raise_for_status()
    return resp.json()


def get_object(path: str):
    key = init_storage()
    resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    if resp.status_code == 404:
        key = init_storage(force=True)
        resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "image/png")


app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ---------- Models ----------
class RecipeRequest(BaseModel):
    ingredients: str
    pantry: List[str] = []
    portions: str = "2"
    time_filter: Optional[str] = None          # "10", "20", "45"
    equipment: List[str] = []                    # fornelli, forno, microonde, frullatore
    diet: str = "Onnivoro"                       # Onnivoro, Vegetariano, Vegano, Senza Glutine, Senza Lattosio


class MiseItem(BaseModel):
    ingredient: str
    quantity: str


class ExcludedItem(BaseModel):
    ingredient: str
    reason: str


class Substitution(BaseModel):
    ingredient: str
    substitute: str


class Impact(BaseModel):
    food_saved_g: int = 0
    savings_eur: float = 0.0


class Recipe(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    tagline: str
    why_it_works: str
    mise_en_place: List[MiseItem]
    brigade_steps: List[str]
    chef_touch: str
    brigade_secret: str = ""
    wine_pairing: str = ""
    impact: Impact = Field(default_factory=Impact)
    excluded_ingredients: List[ExcludedItem] = []
    shopping_list: List[str] = []
    substitutions: List[Substitution] = []
    scrap_tip: str = ""
    category: str = "Piatto Unico"
    diet: str = "Onnivoro"
    allergen_disclaimer: str
    portions: str
    image_url: str = ""
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


DISCLAIMER = ("I consigli sulla gestione di allergeni e ingredienti sono indicativi. "
              "Verificare sempre le etichette dei prodotti prima del consumo.")


def build_system_prompt() -> str:
    return f"""Sei un Executive Chef italiano pluripremiato, esperto di cucina Zero Sprechi (anti-spreco).
Il tuo compito è creare UNA ricetta equilibrata a partire dagli ingredienti che l'utente vuole smaltire.

REGOLE TASSATIVE:
1. REGOLA DI SELEZIONE: NON sei obbligato a usare tutti gli ingredienti forniti. Seleziona SOLO quelli che
   creano un piatto equilibrato e bilanciato tra grassi, acidità, sapidità, dolcezza e consistenze.
   Se due ingredienti cozzano organoletticamente, escludine uno.
2. SEZIONE "I RIMASTI IN DISPENSA": per OGNI ingrediente fornito dall'utente che decidi di ESCLUDERE,
   spiega in 1-2 frasi, con trasparenza professionale, il PERCHÉ dell'esclusione
   (es. "Ho tenuto fuori X perché la sua acidità avrebbe coperto il sapore delicato di Y").
   Non includere in questa lista gli ingredienti della dispensa base (i "Mai Senza").
3. FOCUS TECNICO: i passaggi devono basarsi su tecniche di cottura (rosolatura, sbollentatura, emulsione,
   reazione di Maillard, deglassatura, ecc.) e su indicatori visivi/olfattivi/tattili, non solo su tempi in minuti.
4. Rispetta rigorosamente la dieta e gli allergeni richiesti, il tempo massimo e l'attrezzatura disponibile.
5. Calcola le dosi per il numero di porzioni richiesto.
6. Scrivi tutto in ITALIANO naturale ed elegante, tono da libro di cucina d'autore.

Rispondi ESCLUSIVAMENTE con un oggetto JSON valido (senza testo prima o dopo, senza markdown) con questa struttura esatta:
{{
  "title": "Nome del piatto",
  "tagline": "Breve frase descrittiva ed evocativa",
  "why_it_works": "Spiegazione tecnica dell'abbinamento e del bilanciamento dei sapori (3-5 frasi)",
  "mise_en_place": [{{"ingredient": "nome", "quantity": "dose calcolata per le porzioni"}}],
  "brigade_steps": ["Passaggio 1 focalizzato sulla tecnica", "Passaggio 2", "..."],
  "chef_touch": "Un trucco o consiglio professionale per elevare il piatto",
  "brigade_secret": "Una SINGOLA pillola di tecnica professionale rapida per massimizzare sapore o consistenza usando solo ciò che è disponibile",
  "wine_pairing": "Consiglio di abbinamento (tipologia di vino/vitigno OPPURE una bevanda analcolica/birra) con il motivo in una sola riga legato al bilanciamento dei sapori del piatto",
  "impact": {{"food_saved_g": 0, "savings_eur": 0.0}},
  "excluded_ingredients": [{{"ingredient": "nome", "reason": "motivo dell'esclusione"}}],
  "shopping_list": ["ingrediente mancante 1", "ingrediente mancante 2"],
  "substitutions": [{{"ingredient": "voce presente nella shopping_list", "substitute": "alternativa comune e facilmente reperibile per sostituirla"}}],
  "scrap_tip": "Un consiglio anti-spreco concreto per riutilizzare bucce, scarti o parti solitamente cestinate degli ingredienti di questa ricetta",
  "category": "Categoria del piatto"
}}
REGOLE AGGIUNTIVE PER I NUOVI CAMPI:
- "shopping_list": elenca SOLO gli ingredienti NECESSARI alla ricetta che l'utente NON ha (cioè non presenti né tra gli ingredienti da smaltire né nella dispensa base). Se servono solo ingredienti già disponibili, usa un array vuoto. Non inserire mai in questa lista ingredienti già posseduti dall'utente.
- "substitutions": per OGNI voce presente in "shopping_list", fornisci UNA sostituzione intelligente (un'alternativa facilmente reperibile o probabilmente già in casa che mantenga l'equilibrio del piatto). Il campo "ingredient" deve corrispondere esattamente alla voce della shopping_list. Se shopping_list è vuota, usa un array vuoto.
- "scrap_tip": fornisci sempre un consiglio pratico "Recupero Bucce/Scarti" (es. usare le bucce delle zucchine per un brodo, i gambi delle erbe per un olio aromatico). Deve essere sempre valorizzato.
- "category": classifica il piatto con UNA sola di queste categorie esatte: "Antipasto", "Primo Piatto", "Secondo Piatto", "Contorno", "Zuppa", "Piatto Unico", "Dolce", "Colazione". Scegli quella più appropriata.
- "brigade_secret": una sola frase, un segreto da cuoco professionista rapido ed efficace realizzabile con ciò che c'è (es. bruciare mezza cipolla per un fondo affumicato, mantecare con l'acqua di cottura amidacea a fuoco spento).
- "wine_pairing": consiglia UN abbinamento (vino con tipologia/vitigno oppure una bevanda analcolica o birra) e spiega in una riga il perché in relazione al bilanciamento del piatto.
- "impact": stima approssimativa e simbolica del peso totale in grammi ("food_saved_g", numero intero) e del valore economico in euro ("savings_eur", numero con max 2 decimali) dei SOLI ingredienti di recupero forniti dall'utente che altrimenti sarebbero finiti nella spazzatura. NON contare la dispensa base ("I Mai Senza") né gli ingredienti della lista della spesa. Fornisci stime realistiche da mercato italiano.
Se non escludi nulla, usa un array vuoto per "excluded_ingredients"."""


def build_user_prompt(req: RecipeRequest) -> str:
    time_map = {"10": "massimo 10 minuti", "20": "massimo 20 minuti", "45": "45 minuti o più (tempo libero)"}
    eq = ", ".join(req.equipment) if req.equipment else "nessun vincolo particolare"
    pantry = ", ".join(req.pantry) if req.pantry else "nessuna dispensa base disponibile"
    time_str = time_map.get(req.time_filter, "nessun vincolo di tempo")
    return f"""Ingredienti da smaltire (frigo/dispensa): {req.ingredients}
Dispensa base disponibile ("I Mai Senza"): {pantry}
Numero di porzioni: {req.portions}
Tempo massimo di preparazione: {time_str}
Attrezzatura disponibile: {eq}
Regime alimentare / allergeni: {req.diet}

Crea la miglior ricetta Zero Sprechi possibile rispettando tutte le regole."""


def parse_recipe_json(text: str) -> dict:
    t = text.strip()
    if t.startswith("```"):
        t = t.split("```", 2)[1] if "```" in t else t
        if t.startswith("json"):
            t = t[4:]
        t = t.strip("`").strip()
    start = t.find("{")
    end = t.rfind("}")
    if start != -1 and end != -1:
        t = t[start:end + 1]
    return json.loads(t)


@api_router.get("/")
async def root():
    return {"message": "Zero Sprechi Chef API"}


@api_router.post("/generate-recipe", response_model=Recipe)
async def generate_recipe(req: RecipeRequest):
    if not req.ingredients.strip():
        raise HTTPException(status_code=400, detail="Inserisci almeno un ingrediente da smaltire.")

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"recipe-{uuid.uuid4()}",
        system_message=build_system_prompt(),
    ).with_model("gemini", "gemini-3-flash-preview")

    try:
        response = await chat.send_message(UserMessage(text=build_user_prompt(req)))
        data = parse_recipe_json(response)
    except Exception as e:
        logger.error(f"Recipe generation failed: {e}")
        raise HTTPException(status_code=502, detail="Lo Chef non è riuscito a creare la ricetta. Riprova.")

    try:
        impact = Impact(**data["impact"]) if isinstance(data.get("impact"), dict) else Impact()
    except Exception:
        impact = Impact()

    recipe = Recipe(
        title=data.get("title", "Ricetta dello Chef"),
        tagline=data.get("tagline", ""),
        why_it_works=data.get("why_it_works", ""),
        mise_en_place=[MiseItem(**m) for m in data.get("mise_en_place", []) if isinstance(m, dict)],
        brigade_steps=[str(s) for s in data.get("brigade_steps", [])],
        chef_touch=data.get("chef_touch", ""),
        brigade_secret=data.get("brigade_secret", ""),
        wine_pairing=data.get("wine_pairing", ""),
        impact=impact,
        excluded_ingredients=[ExcludedItem(**x) for x in data.get("excluded_ingredients", []) if isinstance(x, dict)],
        shopping_list=[str(s) for s in data.get("shopping_list", []) if str(s).strip()],
        substitutions=[Substitution(**s) for s in data.get("substitutions", []) if isinstance(s, dict)],
        scrap_tip=data.get("scrap_tip", ""),
        category=data.get("category", "Piatto Unico") or "Piatto Unico",
        diet=req.diet,
        allergen_disclaimer=DISCLAIMER,
        portions=req.portions,
    )

    doc = recipe.model_dump()
    await db.recipes.insert_one({**doc})
    return recipe


# ---------- Scale portions ----------
class ScaleRequest(BaseModel):
    mise_en_place: List[MiseItem]
    from_portions: str
    to_portions: str


@api_router.post("/scale-recipe")
async def scale_recipe(req: ScaleRequest):
    if not req.mise_en_place:
        return {"mise_en_place": []}

    def norm(p: str) -> float:
        return 6.0 if str(p).strip().startswith("6") else float(str(p).strip() or "1")

    factor = norm(req.to_portions) / max(norm(req.from_portions), 1.0)

    num_re = re.compile(r"\d+\s*/\s*\d+|\d+(?:[.,]\d+)?")

    def fmt(n: float) -> str:
        if abs(n - round(n)) < 0.05:
            return str(int(round(n)))
        return str(round(n, 2)).rstrip("0").rstrip(".")

    def scale_quantity(q: str) -> str:
        if not q:
            return q
        low = q.lower()
        if "q.b" in low or "quanto basta" in low:
            return q

        def repl(m):
            tok = m.group(0)
            try:
                if "/" in tok:
                    val = float(Fraction(tok.replace(" ", ""))) * factor
                else:
                    val = float(tok.replace(",", ".")) * factor
            except Exception:
                return tok
            return fmt(val)

        return num_re.sub(repl, q)

    result = [{"ingredient": m.ingredient, "quantity": scale_quantity(m.quantity)} for m in req.mise_en_place]
    return {"mise_en_place": result}


# ---------- Dish image ----------
class ImageRequest(BaseModel):
    recipe_id: str
    title: str
    tagline: str = ""


@api_router.post("/recipe-image")
async def recipe_image(req: ImageRequest):
    prompt = (
        f"Fotografia gastronomica professionale d'autore di un piatto italiano chiamato '{req.title}'. "
        f"{req.tagline}. Impiattamento elegante e curato, luce naturale morbida e calda, sfondo rustico "
        "in tonalità panna e legno, stile editoriale da libro di cucina d'alta cucina, vista dall'alto a 45 gradi, "
        "colori caldi e appetitosi, alta risoluzione, nessun testo, nessuna scritta."
    )
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"img-{uuid.uuid4()}",
        system_message="You are a professional food photographer.",
    ).with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])

    try:
        _, images = await chat.send_message_multimodal_response(UserMessage(text=prompt))
        if not images:
            raise RuntimeError("no image returned")
        image_bytes = base64.b64decode(images[0]["data"])
        path = f"{APP_NAME}/recipes/{req.recipe_id}.png"
        put_object(path, image_bytes, "image/png")
        image_url = f"/api/recipe-image/{path}"
        await db.recipes.update_one({"id": req.recipe_id}, {"$set": {"image_url": image_url}})
        return {"image_url": image_url}
    except Exception as e:
        logger.error(f"Image generation failed: {e}")
        raise HTTPException(status_code=502, detail="Impossibile generare la foto del piatto.")


@api_router.get("/recipe-image/{path:path}")
async def serve_recipe_image(path: str):
    try:
        data, content_type = get_object(path)
        return Response(content=data, media_type=content_type,
                        headers={"Cache-Control": "public, max-age=31536000"})
    except Exception:
        raise HTTPException(status_code=404, detail="Immagine non trovata.")


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_storage():
    try:
        init_storage()
        logger.info("Object storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
