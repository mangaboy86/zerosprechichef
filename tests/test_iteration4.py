"""Iteration 4 backend tests: substitutions alignment with shopping_list, deterministic /api/scale-recipe."""
import os
import re
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://chef-guided-cooking.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------------- Deterministic /api/scale-recipe (no LLM) ----------------
def test_scale_recipe_2_to_4_doubles(session):
    payload = {
        "mise_en_place": [
            {"ingredient": "Zucchine", "quantity": "200 g"},
            {"ingredient": "Uova", "quantity": "2"},
            {"ingredient": "Olio EVO", "quantity": "q.b."},
            {"ingredient": "Latte", "quantity": "1/2 tazza"},
            {"ingredient": "Sale", "quantity": "quanto basta"},
            {"ingredient": "Pepe", "quantity": "1,5 g"},
        ],
        "from_portions": "2",
        "to_portions": "4",
    }
    r = session.post(f"{API}/scale-recipe", json=payload, timeout=15)
    assert r.status_code == 200, r.text
    out = r.json()["mise_en_place"]
    d = {m["ingredient"]: m["quantity"] for m in out}
    assert "400" in d["Zucchine"]
    assert d["Uova"].strip() in ("4", "4.0")
    assert "q.b" in d["Olio EVO"].lower()
    assert "quanto basta" in d["Sale"].lower()
    # 1/2 -> 1 (doubled)
    assert re.search(r"\b1\b", d["Latte"])
    # 1,5 -> 3
    assert "3" in d["Pepe"]


def test_scale_recipe_2_to_6plus(session):
    payload = {
        "mise_en_place": [{"ingredient": "Pane", "quantity": "100 g"}],
        "from_portions": "2",
        "to_portions": "6+",
    }
    r = session.post(f"{API}/scale-recipe", json=payload, timeout=15)
    assert r.status_code == 200
    out = r.json()["mise_en_place"]
    assert "300" in out[0]["quantity"]


def test_scale_recipe_empty(session):
    r = session.post(f"{API}/scale-recipe",
                     json={"mise_en_place": [], "from_portions": "2", "to_portions": "4"},
                     timeout=10)
    assert r.status_code == 200
    assert r.json() == {"mise_en_place": []}


# ---------------- Substitutions alignment with shopping_list ----------------
@pytest.fixture(scope="module")
def minimal_recipe(session):
    """Force LLM to have to put items in shopping_list by giving minimal ingredients."""
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
    return r.json()


def test_substitutions_field_present_and_typed(minimal_recipe):
    subs = minimal_recipe.get("substitutions")
    assert isinstance(subs, list), f"substitutions must be a list, got: {type(subs)}"
    for s in subs:
        assert isinstance(s, dict)
        assert "ingredient" in s and "substitute" in s
        assert isinstance(s["ingredient"], str) and s["ingredient"].strip()
        assert isinstance(s["substitute"], str) and s["substitute"].strip()


def test_substitutions_align_with_shopping_list(minimal_recipe):
    shopping = [x.lower().strip() for x in minimal_recipe.get("shopping_list", [])]
    subs = minimal_recipe.get("substitutions", [])
    # If shopping_list is empty, substitutions must be empty
    if not shopping:
        assert subs == [], f"Expected empty substitutions when shopping_list is empty, got {subs}"
        return
    # Every substitution ingredient should match an entry in shopping_list
    for s in subs:
        assert s["ingredient"].lower().strip() in shopping, (
            f"Substitution '{s['ingredient']}' not found in shopping_list {shopping}"
        )


def test_substitutions_empty_when_shopping_empty(session):
    """A payload with abundant ingredients+pantry so LLM likely returns empty shopping_list."""
    payload = {
        "ingredients": "zucchine, uova, ricotta, pane raffermo, limone, basilico, aglio, cipolla",
        "pantry": ["Olio EVO", "Sale", "Pepe", "Aceto", "Farina", "Zucchero", "Latte", "Burro"],
        "portions": "2",
        "time_filter": "45",
        "equipment": ["Fornelli", "Forno"],
        "diet": "Onnivoro",
    }
    r = session.post(f"{API}/generate-recipe", json=payload, timeout=180)
    assert r.status_code == 200, r.text
    data = r.json()
    if not data.get("shopping_list"):
        assert data.get("substitutions", []) == [], (
            f"substitutions must be empty when shopping_list empty, got {data.get('substitutions')}"
        )
    else:
        # otherwise, at least still aligned
        shopping = [x.lower().strip() for x in data["shopping_list"]]
        for s in data.get("substitutions", []):
            assert s["ingredient"].lower().strip() in shopping
