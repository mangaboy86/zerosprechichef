from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
import logging
import uuid
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


class Recipe(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    tagline: str
    why_it_works: str
    mise_en_place: List[MiseItem]
    brigade_steps: List[str]
    chef_touch: str
    excluded_ingredients: List[ExcludedItem] = []
    shopping_list: List[str] = []
    scrap_tip: str = ""
    diet: str = "Onnivoro"
    allergen_disclaimer: str
    portions: str
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
  "excluded_ingredients": [{{"ingredient": "nome", "reason": "motivo dell'esclusione"}}],
  "shopping_list": ["ingrediente mancante 1", "ingrediente mancante 2"],
  "scrap_tip": "Un consiglio anti-spreco concreto per riutilizzare bucce, scarti o parti solitamente cestinate degli ingredienti di questa ricetta"
}}
REGOLE AGGIUNTIVE PER I NUOVI CAMPI:
- "shopping_list": elenca SOLO gli ingredienti NECESSARI alla ricetta che l'utente NON ha (cioè non presenti né tra gli ingredienti da smaltire né nella dispensa base). Se servono solo ingredienti già disponibili, usa un array vuoto. Non inserire mai in questa lista ingredienti già posseduti dall'utente.
- "scrap_tip": fornisci sempre un consiglio pratico "Recupero Bucce/Scarti" (es. usare le bucce delle zucchine per un brodo, i gambi delle erbe per un olio aromatico). Deve essere sempre valorizzato.
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

    recipe = Recipe(
        title=data.get("title", "Ricetta dello Chef"),
        tagline=data.get("tagline", ""),
        why_it_works=data.get("why_it_works", ""),
        mise_en_place=[MiseItem(**m) for m in data.get("mise_en_place", []) if isinstance(m, dict)],
        brigade_steps=[str(s) for s in data.get("brigade_steps", [])],
        chef_touch=data.get("chef_touch", ""),
        excluded_ingredients=[ExcludedItem(**x) for x in data.get("excluded_ingredients", []) if isinstance(x, dict)],
        shopping_list=[str(s) for s in data.get("shopping_list", []) if str(s).strip()],
        scrap_tip=data.get("scrap_tip", ""),
        diet=req.diet,
        allergen_disclaimer=DISCLAIMER,
        portions=req.portions,
    )

    doc = recipe.model_dump()
    await db.recipes.insert_one({**doc})
    return recipe


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
