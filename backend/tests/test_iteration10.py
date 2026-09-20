"""Iteration 10 regression tests: no functional changes expected.

Focus:
- POST /api/scale-recipe: still doubles numeric quantities 2->4, keeps 'q.b.', handles fractions.
- POST /api/generate-recipe: still returns full recipe with 4-field impact all > 0, category,
  aligned substitutions, brigade_secret, wine_pairing, allergen_disclaimer.
- POST /api/generate-recipe with empty ingredients -> 400.
"""
import os
import pytest
import requests


def _load_url():
    u = os.environ.get("REACT_APP_BACKEND_URL", "").strip()
    if u:
        return u.rstrip("/")
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL"):
                    return line.split("=", 1)[1].strip().rstrip("/")
    except Exception:
        pass
    return ""


BASE_URL = _load_url()
API = f"{BASE_URL}/api"


# ---------- scale-recipe ----------
def test_scale_doubles_numeric_grams():
    payload = {
        "mise_en_place": [
            {"ingredient": "Farina", "quantity": "120g"},
            {"ingredient": "Olio", "quantity": "30 ml"},
        ],
        "from_portions": "2",
        "to_portions": "4",
    }
    r = requests.post(f"{API}/scale-recipe", json=payload, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    quantities = [m["quantity"] for m in data["mise_en_place"]]
    assert "240" in quantities[0], quantities
    assert quantities[0].endswith("g") or quantities[0].endswith("g")
    assert "60" in quantities[1], quantities


def test_scale_keeps_qb():
    payload = {
        "mise_en_place": [
            {"ingredient": "Sale", "quantity": "q.b."},
            {"ingredient": "Pepe", "quantity": "Quanto basta"},
        ],
        "from_portions": "2",
        "to_portions": "4",
    }
    r = requests.post(f"{API}/scale-recipe", json=payload, timeout=30)
    assert r.status_code == 200
    qs = [m["quantity"] for m in r.json()["mise_en_place"]]
    assert qs[0] == "q.b."
    assert qs[1] == "Quanto basta"


def test_scale_handles_fractions():
    payload = {
        "mise_en_place": [{"ingredient": "Limone", "quantity": "1/2"}],
        "from_portions": "2",
        "to_portions": "4",
    }
    r = requests.post(f"{API}/scale-recipe", json=payload, timeout=30)
    assert r.status_code == 200
    q = r.json()["mise_en_place"][0]["quantity"]
    assert q == "1", q


def test_scale_empty_returns_empty():
    r = requests.post(
        f"{API}/scale-recipe",
        json={"mise_en_place": [], "from_portions": "2", "to_portions": "4"},
        timeout=30,
    )
    assert r.status_code == 200
    assert r.json() == {"mise_en_place": []}


# ---------- generate-recipe ----------
@pytest.fixture(scope="module")
def generated_recipe():
    payload = {
        "ingredients": "zucchine, pane raffermo, ricotta, limone, prezzemolo",
        "pantry": ["Olio EVO", "Sale", "Pepe"],
        "portions": "2",
        "time_filter": "45",
        "equipment": ["Fornelli", "Forno"],
        "diet": "Onnivoro",
    }
    r = requests.post(f"{API}/generate-recipe", json=payload, timeout=180)
    assert r.status_code == 200, r.text
    return r.json()


def test_recipe_has_all_fields(generated_recipe):
    r = generated_recipe
    for k in [
        "title",
        "mise_en_place",
        "brigade_steps",
        "chef_touch",
        "shopping_list",
        "substitutions",
        "impact",
        "category",
        "brigade_secret",
        "wine_pairing",
        "allergen_disclaimer",
    ]:
        assert k in r, f"missing {k}"


def test_impact_four_fields_positive(generated_recipe):
    imp = generated_recipe["impact"]
    for k in ("food_saved_g", "savings_eur", "co2_saved_kg", "water_saved_l"):
        assert k in imp
        assert imp[k] > 0, f"{k}={imp[k]} not > 0 (impact={imp})"


def test_substitutions_aligned_with_shopping(generated_recipe):
    r = generated_recipe
    shop = [s.lower() for s in r.get("shopping_list", [])]
    subs = r.get("substitutions", [])
    assert isinstance(subs, list)
    # each substitution ingredient should correspond loosely to a shopping list item
    if subs and shop:
        for s in subs:
            ing = s.get("ingredient", "").lower()
            assert any(ing in x or x in ing for x in shop), f"sub {ing} not in shopping list {shop}"


def test_empty_ingredients_400():
    r = requests.post(
        f"{API}/generate-recipe",
        json={"ingredients": "", "pantry": [], "portions": "2", "equipment": []},
        timeout=30,
    )
    assert r.status_code == 400, r.text
