"""Iteration 3 backend tests: category field, scale-recipe, recipe-image."""
import os
import re
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

VALID_CATEGORIES = {
    "Antipasto", "Primo Piatto", "Secondo Piatto", "Contorno",
    "Zuppa", "Piatto Unico", "Dolce", "Colazione",
}


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def generated_recipe(session):
    payload = {
        "ingredients": "spaghetti, pomodorini maturi, aglio, basilico fresco",
        "pantry": ["Olio EVO", "Sale", "Pepe"],
        "portions": "2",
        "time_filter": "20",
        "equipment": ["Solo fornelli"],
        "diet": "Onnivoro",
    }
    r = session.post(f"{API}/generate-recipe", json=payload, timeout=180)
    assert r.status_code == 200, r.text
    return r.json()


# --- Category ---
def test_category_field_present_and_valid(generated_recipe):
    assert "category" in generated_recipe
    assert generated_recipe["category"] in VALID_CATEGORIES, generated_recipe["category"]


def test_image_url_field_present(generated_recipe):
    assert "image_url" in generated_recipe
    assert isinstance(generated_recipe["image_url"], str)


# --- Scale recipe ---
def _num(s):
    m = re.search(r"(\d+(?:[.,]\d+)?)", s)
    return float(m.group(1).replace(",", ".")) if m else None


def test_scale_recipe_2_to_4_doubles_numeric(session):
    payload = {
        "mise_en_place": [
            {"ingredient": "Spaghetti", "quantity": "120g"},
            {"ingredient": "Uova", "quantity": "2 intere"},
            {"ingredient": "Sale", "quantity": "q.b."},
            {"ingredient": "Olio EVO", "quantity": "2 cucchiai"},
        ],
        "from_portions": "2",
        "to_portions": "4",
    }
    r = session.post(f"{API}/scale-recipe", json=payload, timeout=120)
    assert r.status_code == 200, r.text
    result = r.json()["mise_en_place"]
    assert len(result) == 4
    by_ing = {m["ingredient"].lower(): m["quantity"] for m in result}

    # spaghetti: 120 -> ~240
    sp = _num(by_ing["spaghetti"])
    assert sp is not None and 200 <= sp <= 260, f"spaghetti scaled to {sp}"

    # uova: 2 -> 4
    uova = _num(by_ing["uova"])
    assert uova is not None and 3.5 <= uova <= 4.5, f"uova scaled to {uova}"

    # sale: q.b. unchanged
    assert "q.b" in by_ing["sale"].lower() or "quanto basta" in by_ing["sale"].lower()

    # olio: 2 -> ~4
    olio = _num(by_ing["olio evo"])
    assert olio is not None and 3.5 <= olio <= 4.5, f"olio scaled to {olio}"


def test_scale_recipe_empty_returns_empty(session):
    r = session.post(f"{API}/scale-recipe",
                     json={"mise_en_place": [], "from_portions": "2", "to_portions": "4"},
                     timeout=30)
    assert r.status_code == 200
    assert r.json() == {"mise_en_place": []}


# --- Recipe image ---
def test_recipe_image_generation_and_serve(session, generated_recipe):
    payload = {
        "recipe_id": generated_recipe["id"],
        "title": generated_recipe["title"],
        "tagline": generated_recipe.get("tagline", ""),
    }
    r = session.post(f"{API}/recipe-image", json=payload, timeout=180)
    assert r.status_code == 200, r.text
    body = r.json()
    assert "image_url" in body
    url = body["image_url"]
    assert url.startswith("/api/recipe-image/")

    # GET the served image
    served = requests.get(f"{BASE_URL}{url}", timeout=60)
    assert served.status_code == 200
    assert served.headers.get("Content-Type", "").startswith("image/")
    assert len(served.content) > 1000  # non-trivial bytes
