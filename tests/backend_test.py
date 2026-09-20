"""Backend API tests for Zero Sprechi Chef."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://chef-guided-cooking.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

MANDATORY_DISCLAIMER_KEYWORDS = ["etichette", "prodotti"]


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --- Health / root ---
def test_root(session):
    r = session.get(f"{API}/", timeout=15)
    assert r.status_code == 200
    assert "message" in r.json()


# --- Validation ---
def test_empty_ingredients_returns_400(session):
    r = session.post(f"{API}/generate-recipe", json={"ingredients": "   "}, timeout=30)
    assert r.status_code == 400
    assert "detail" in r.json()


# --- Generation: omnivoro basic ---
@pytest.fixture(scope="module")
def omnivoro_recipe(session):
    payload = {
        "ingredients": "mezza zucchina appassita, ricotta, due uova, pane raffermo, un limone",
        "pantry": ["Olio EVO", "Sale", "Pepe"],
        "portions": "2",
        "time_filter": "20",
        "equipment": ["Solo fornelli"],
        "diet": "Onnivoro",
    }
    r = session.post(f"{API}/generate-recipe", json=payload, timeout=180)
    assert r.status_code == 200, f"Body: {r.text}"
    return r.json()


def test_recipe_shape(omnivoro_recipe):
    r = omnivoro_recipe
    for k in ["id", "title", "tagline", "why_it_works", "mise_en_place",
              "brigade_steps", "chef_touch", "excluded_ingredients",
              "allergen_disclaimer", "portions", "shopping_list", "scrap_tip", "diet"]:
        assert k in r, f"Missing key {k}"
    assert isinstance(r["mise_en_place"], list) and len(r["mise_en_place"]) > 0
    for m in r["mise_en_place"]:
        assert "ingredient" in m and "quantity" in m
    assert isinstance(r["brigade_steps"], list) and len(r["brigade_steps"]) > 0
    assert all(isinstance(s, str) for s in r["brigade_steps"])
    assert isinstance(r["excluded_ingredients"], list)
    for x in r["excluded_ingredients"]:
        assert "ingredient" in x and "reason" in x


def test_disclaimer_present(omnivoro_recipe):
    d = omnivoro_recipe["allergen_disclaimer"]
    assert isinstance(d, str) and len(d) > 20
    low = d.lower()
    for kw in MANDATORY_DISCLAIMER_KEYWORDS:
        assert kw in low, f"Disclaimer missing keyword: {kw} ({d})"


def test_no_mongo_id_leaked(omnivoro_recipe):
    assert "_id" not in omnivoro_recipe


# --- New fields: scrap_tip, diet echo, shopping_list ---
def test_scrap_tip_non_empty(omnivoro_recipe):
    st = omnivoro_recipe.get("scrap_tip", "")
    assert isinstance(st, str) and len(st.strip()) > 5, f"scrap_tip should be a non-empty string, got: {st!r}"


def test_diet_echoed(omnivoro_recipe):
    assert omnivoro_recipe.get("diet") == "Onnivoro"


def test_shopping_list_only_missing_items(session):
    # Minimal ingredients so LLM likely suggests missing items.
    payload = {
        "ingredients": "un limone",
        "pantry": ["Olio EVO", "Sale"],
        "portions": "2",
        "time_filter": "20",
        "equipment": ["Solo fornelli"],
        "diet": "Onnivoro",
    }
    r = session.post(f"{API}/generate-recipe", json=payload, timeout=180)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "shopping_list" in data and isinstance(data["shopping_list"], list)
    owned = {"limone", "olio evo", "sale", "olio"}
    for item in data["shopping_list"]:
        assert isinstance(item, str) and item.strip()
        low = item.lower()
        # No owned item should be exactly present in shopping list
        for o in owned:
            assert o != low, f"Shopping list wrongly includes owned item: {item}"
    # scrap tip always present
    assert data.get("scrap_tip", "").strip(), "scrap_tip must be non-empty"
    assert data.get("diet") == "Onnivoro"


# --- Vegan diet: exclusion rule ---
def test_vegan_excludes_animal_products(session):
    payload = {
        "ingredients": "prosciutto crudo, formaggio grana, zucchine, pomodori, basilico, pane raffermo",
        "pantry": ["Olio EVO", "Sale"],
        "portions": "2",
        "time_filter": "20",
        "equipment": ["Solo fornelli"],
        "diet": "Vegano",
    }
    r = session.post(f"{API}/generate-recipe", json=payload, timeout=180)
    assert r.status_code == 200, r.text
    data = r.json()
    excluded_names = " ".join(x["ingredient"].lower() for x in data.get("excluded_ingredients", []))
    mise_names = " ".join(m["ingredient"].lower() for m in data.get("mise_en_place", []))
    # animal ingredients should NOT appear in mise, and SHOULD appear in excluded
    for banned in ["prosciutto", "formaggio", "grana"]:
        assert banned not in mise_names, f"Vegan recipe still contains {banned} in mise_en_place: {mise_names}"
    # at least one exclusion with a reason
    assert len(data["excluded_ingredients"]) >= 1
    assert any(x["reason"].strip() for x in data["excluded_ingredients"])
    # ideally prosciutto or formaggio in excluded
    assert ("prosciutto" in excluded_names) or ("formaggio" in excluded_names) or ("grana" in excluded_names), \
        f"Expected animal product in excluded, got: {excluded_names}"
